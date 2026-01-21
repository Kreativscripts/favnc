import os
import socket
import http.server
import socketserver

PORT = 8000
ZIP_PATH = r"C:\Users\patro\Downloads\MACRO.zip"
ZIP_NAME = "MACRO.zip"

class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path != "/":
            self.send_error(404)
            return

        if not os.path.exists(ZIP_PATH):
            self.send_error(404, "MACRO.zip not found")
            return

        file_size = os.path.getsize(ZIP_PATH)

        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f'attachment; filename="{ZIP_NAME}"')
        self.send_header("Content-Length", file_size)
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()

        with open(ZIP_PATH, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (ConnectionResetError, BrokenPipeError):
                    break

class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    ip = socket.gethostbyname(socket.gethostname())
    print("📦 MACRO ZIP SERVER")
    print(f"🌐 http://{ip}:{PORT}")
    print("📁 Serving: MACRO.zip")
    print("📱 Open the link on another device to download")
    print("\nPress Ctrl+C to stop")

    with ThreadedServer(("", PORT), Handler) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
