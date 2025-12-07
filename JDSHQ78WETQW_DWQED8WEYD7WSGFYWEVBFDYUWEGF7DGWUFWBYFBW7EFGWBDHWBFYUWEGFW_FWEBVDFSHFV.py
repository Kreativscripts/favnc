from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn, json, time, uuid, mimetypes, threading

B = Path(__file__).resolve().parent
D_BIN = B/"chat"/"a9x3e_bin"
D_DB = B/"chat"/"a4d1x_msgs.json"
M = threading.Lock()
TTL = 4*24*3600
MAX = 10*1024*1024
BAD = ["fuck","shit","bitch","cunt","nigga","nigger","hoe","whore","slut","dick","cock","pussy","faggot"]
INV = ("discord.gg/",".gg/","discord/invite")

D_BIN.mkdir(parents=True, exist_ok=True)

def L():
    if not D_DB.exists(): return []
    try: return json.loads(D_DB.read_text())
    except: return []

def S(x):
    D_DB.write_text(json.dumps(x))

def Cwords(t):
    import re
    r = t
    for w in BAD:
        e = "".join("\\"+c if c in r"-/\^$*+?.()|[]{}" else c for c in w)
        r = re.sub(r"\b"+e+r"\b", lambda m: "#"*len(m.group(0)), r, flags=re.I)
    return r

def Cinv(t):
    v = t.lower()
    return any(i in v for i in INV)

def CLEAN():
    n = time.time()
    with M:
        x = L()
        k = []
        for m in x:
            if n - m["ts0"] > TTL:
                if m.get("f0"):
                    f = D_BIN/m["f0"]
                    if f.exists(): f.unlink()
            else:
                k.append(m)
        S(k)

A = FastAPI()
A.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
A.mount("/_cbin", StaticFiles(directory=str(D_BIN)), name="cbin")

@A.post("/api/x19z_push")
async def send(u0: str = Form(...), t0: str = Form(""), file: UploadFile = File(None)):
    CLEAN()
    u0 = (u0 or "").strip()[:24]
    if not u0:
        return JSONResponse({"ok":0,"e":"no-username"})

    if not t0 and not file:
        return JSONResponse({"ok":0,"e":"empty"})

    if Cinv(t0):
        return JSONResponse({"ok":0,"e":"invite-block"})

    t0 = Cwords(t0 or "")
    f0 = None
    ftype = None
    furl = None

    if file:
        c = await file.read()
        if len(c) > MAX:
            return JSONResponse({"ok":0,"e":"max-10mb"})
        ftype = file.content_type or mimetypes.guess_type(file.filename or "")[0]
        if not (ftype.startswith("image/") or ftype.startswith("video/")):
            return JSONResponse({"ok":0,"e":"bad-filetype"})
        ext = ("."+file.filename.split(".")[-1]) if "." in file.filename else ""
        nm = f"{int(time.time())}_{uuid.uuid4().hex}{ext}"
        (D_BIN/nm).write_bytes(c)
        f0 = nm
        furl = f"/_cbin/{nm}"

    m = {
        "i0": uuid.uuid4().hex,
        "u0": u0,
        "t0": t0,
        "ts0": time.time(),
        "f0": f0,
        "ftype": ftype,
        "url": furl
    }

    with M:
        z = L()
        z.append(m)
        z = z[-500:]
        S(z)

    return {"ok":1,"d":m}

@A.get("/api/y80p_read")
def read(limit: int = 100):
    CLEAN()
    with M:
        z = L()
        return {"ok":1,"msgs":z[-limit:]}

if __name__ == "__main__":
    uvicorn.run("fx_core_91x9x:A", host="0.0.0.0", port=5050, reload=True)
