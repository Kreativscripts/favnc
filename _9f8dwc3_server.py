from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn, json, time, uuid, mimetypes, threading

BASE = Path(__file__).resolve().parent
BIN_DIR = BASE/"chat"/"a9x3e_bin"
DB_FILE = BASE/"chat"/"a4d1x_msgs.json"
LOCK = threading.Lock()
TTL = 4*24*3600
MAX_BYTES = 10*1024*1024
BAD_WORDS = ["fuck","shit","bitch","cunt","nigga","nigger","hoe","whore","slut","dick","cock","pussy","faggot"]
INV_PATTERNS = ("discord.gg/",".gg/","discord/invite")

BIN_DIR.mkdir(parents=True, exist_ok=True)
BIN_DIR.parent.mkdir(parents=True, exist_ok=True)

def load_db():
    if not DB_FILE.exists():
        return []
    try:
        return json.loads(DB_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []

def save_db(messages):
    DB_FILE.write_text(json.dumps(messages, ensure_ascii=False), encoding="utf-8")

def censor_text(text: str) -> str:
    import re
    t = text
    for w in BAD_WORDS:
        esc = "".join("\\"+c if c in r"-/\^$*+?.()|[]{}" else c for c in w)
        r = re.compile(r"\b"+esc+r"\b", re.IGNORECASE)
        t = r.sub(lambda m: "#" * len(m.group(0)), t)
    return t

def has_invite(text: str) -> bool:
    low = text.lower()
    return any(p in low for p in INV_PATTERNS)

def cleanup_expired():
    now = time.time()
    with LOCK:
        msgs = load_db()
        keep = []
        for m in msgs:
            ts = m.get("ts0", 0)
            if now - ts > TTL:
                fp = m.get("f0")
                if fp:
                    p = BIN_DIR/fp
                    try:
                        p.unlink()
                    except FileNotFoundError:
                        pass
            else:
                keep.append(m)
        save_db(keep)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/_cbin", StaticFiles(directory=str(BIN_DIR)), name="cbin")

@app.post("/api/x19z_push")
async def send(u0: str = Form(...), t0: str = Form(""), file: UploadFile = File(None)):
    cleanup_expired()
    u0 = (u0 or "").strip()[:24]
    if not u0:
        return JSONResponse({"ok": 0, "e": "no-username"}, status_code=400)

    if not t0 and not file:
        return JSONResponse({"ok": 0, "e": "empty"}, status_code=400)

    if has_invite(t0):
        return JSONResponse({"ok": 0, "e": "invite-block"}, status_code=400)

    t0 = censor_text(t0 or "")
    f0 = None
    ftype = None
    furl = None

    if file:
        data = await file.read()
        if len(data) > MAX_BYTES:
            return JSONResponse({"ok": 0, "e": "max-10mb"}, status_code=400)
        ftype = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
        if not (ftype.startswith("image/") or ftype.startswith("video/")):
            return JSONResponse({"ok": 0, "e": "bad-filetype"}, status_code=400)
        ext = "."+file.filename.rsplit(".",1)[-1] if file.filename and "." in file.filename else ""
        name = f"{int(time.time())}_{uuid.uuid4().hex}{ext}"
        (BIN_DIR/name).write_bytes(data)
        f0 = name
        furl = f"/_cbin/{name}"

    msg = {
        "i0": uuid.uuid4().hex,
        "u0": u0,
        "t0": t0,
        "ts0": time.time(),
        "f0": f0,
        "ftype": ftype,
        "url": furl,
    }

    with LOCK:
        msgs = load_db()
        msgs.append(msg)
        msgs = msgs[-500:]
        save_db(msgs)

    return {"ok": 1, "d": msg}

@app.get("/api/y80p_read")
def read(limit: int = 100):
    cleanup_expired()
    limit = max(1, min(limit, 200))
    with LOCK:
        msgs = load_db()
        msgs = msgs[-limit:]
    return {"ok": 1, "msgs": msgs}

if __name__ == "__main__":
    uvicorn.run("_9f8dwc3_server:app", host="0.0.0.0", port=5050, reload=True)
