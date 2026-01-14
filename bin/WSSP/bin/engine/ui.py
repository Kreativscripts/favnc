import asyncio, cv2, base64, json
import websockets, threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

clients = set()

class UIHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.path = "/ui/index.html"
        return super().do_GET()

def start_http():
    os.chdir(os.path.dirname(os.path.dirname(__file__)))
    HTTPServer(("0.0.0.0", 2001), UIHandler).serve_forever()

async def ws_handler(ws):
    clients.add(ws)
    try:
        await ws.wait_closed()
    finally:
        clients.remove(ws)

async def stream_loop(frame_q, event_q):
    while True:
        if frame_q.empty():
            await asyncio.sleep(0.005)
            continue

        ts, frame = frame_q.get()
        _, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])

        payload = {
            "ts": ts,
            "frame": base64.b64encode(jpg.tobytes()).decode(),
            "events": []
        }

        while not event_q.empty():
            payload["events"].append(event_q.get())

        if clients:
            msg = json.dumps(payload)
            await asyncio.gather(*[c.send(msg) for c in clients])

async def ws_server(frame_q, event_q):
    async with websockets.serve(ws_handler, "0.0.0.0", 2000):
        await stream_loop(frame_q, event_q)

def ui_server_start(frame_q, event_q):
    threading.Thread(target=start_http, daemon=True).start()
    asyncio.run(ws_server(frame_q, event_q))
