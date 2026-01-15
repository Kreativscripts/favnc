import http.server
import socketserver
import socket
import threading
import random
import json
import os
import webbrowser
import sys
import time
import tempfile
from datetime import datetime
import shutil

APP_NAME = "WSS Exam Them"
LOG_FILE = "events.json"
DASHBOARD_FILE = "dashboard.html"

# ---------------- HELPERS ----------------
def resource_path(name):
    """Return path to resource, PyInstaller-safe"""
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, name)
    return os.path.join(os.path.abspath("."), name)

def get_lan_ip():
    """Get LAN IP or fallback to 127.0.0.1"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

# ---------------- HTTP HANDLER ----------------
class EWSSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.serve_path = kwargs.pop("serve_path")
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path):
        """Override to serve from our temp directory"""
        # Special handling for root path
        if path == '/':
            path = '/dashboard.html'
        
        # Clean up the path
        path = path.lstrip('/')
        
        # Return the actual file path in temp directory
        return os.path.join(self.serve_path, path)
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            # Set default to dashboard.html for root
            if self.path in ['/', '/index.html']:
                self.path = '/dashboard.html'
            
            # Handle the request
            f = self.send_head()
            if f:
                self.copyfile(f, self.wfile)
                f.close()
        except Exception as e:
            print(f"Error serving GET request: {e}")
            self.send_error(404, "File not found")
    
    def send_head(self):
        """Common code for GET and HEAD commands"""
        path = self.translate_path(self.path)
        
        # Check if file exists
        if not os.path.exists(path):
            # If dashboard.html is requested but not found, try to copy it
            if self.path.endswith('dashboard.html'):
                try:
                    src = resource_path(DASHBOARD_FILE)
                    if os.path.exists(src):
                        shutil.copy(src, path)
                    else:
                        return None
                except:
                    return None
        
        # Check if it's a file
        if os.path.isdir(path):
            # Redirect to dashboard if directory is accessed
            self.send_response(302)
            self.send_header('Location', '/dashboard.html')
            self.end_headers()
            return None
        
        # Set content type
        if path.endswith('.html'):
            ctype = 'text/html'
        elif path.endswith('.json'):
            ctype = 'application/json'
        elif path.endswith('.js'):
            ctype = 'application/javascript'
        elif path.endswith('.css'):
            ctype = 'text/css'
        else:
            ctype = 'application/octet-stream'
        
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
        
        self.send_response(200)
        self.send_header("Content-type", ctype)
        self.send_header("Content-Length", str(os.fstat(f.fileno()).st_size))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.end_headers()
        return f

def do_POST(self):
    if self.path == "/log":
        # Handle log events from students
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        
        try:
            data = json.loads(body.decode())
        except:
            self.send_response(400)
            self.end_headers()
            return
        
        data["server_time"] = datetime.now().strftime("%H:%M:%S")
        log_path = os.path.join(self.serve_path, LOG_FILE)
        events = []
        
        if os.path.exists(log_path):
            try:
                with open(log_path, "r") as f:
                    events = json.load(f)
            except:
                events = []
        
        events.append(data)
        
        try:
            with open(log_path, "w") as f:
                json.dump(events, f, indent=2)
        except Exception as e:
            print(f"Error writing log: {e}")
            self.send_response(500)
            self.end_headers()
            return
        
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "message": "Event logged"}).encode())
        
    elif self.path == "/clear":
        # Handle clearing the event log
        log_path = os.path.join(self.serve_path, LOG_FILE)
        
        try:
            # Clear the events file
            with open(log_path, "w") as f:
                json.dump([], f)
            
            # Send success response
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "cleared", "message": "Event log cleared"}).encode())
            
            print("Event log cleared by user")
            
        except Exception as e:
            print(f"Error clearing log: {e}")
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
            
    else:
        # Unknown endpoint
        self.send_response(404)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "error", "message": "Endpoint not found"}).encode())

    def log_message(self, format, *args):
        """Override to prevent logging every request to console"""
        pass

# ---------------- SERVER ----------------
def start_server(port, serve_path):
    handler = lambda *args, **kwargs: EWSSHandler(*args, serve_path=serve_path, **kwargs)
    
    while True:
        try:
            with socketserver.ThreadingTCPServer(("0.0.0.0", port), handler) as httpd:
                print(f"{APP_NAME} listening on port {port}")
                httpd.serve_forever()
        except OSError as e:
            print(f"Port {port} blocked ({e}), trying another port...")
            port = random.randint(20000, 45000)
            continue
        except Exception as e:
            print(f"Server error: {e}")
            time.sleep(1)
            port = random.randint(20000, 45000)
            continue

# ---------------- MAIN ----------------
if __name__ == "__main__":
    # Random LAN port
    port = random.randint(20000, 45000)
    ip = get_lan_ip()
    
    # Create temp folder for EXE to serve files
    temp_dir = tempfile.mkdtemp(prefix="EWSS_")
    print(f"Serving files from: {temp_dir}")
    
    # Copy dashboard.html to temp_dir
    try:
        dashboard_src = resource_path(DASHBOARD_FILE)
        print(f"Looking for dashboard at: {dashboard_src}")
        
        if os.path.exists(dashboard_src):
            shutil.copy(dashboard_src, os.path.join(temp_dir, DASHBOARD_FILE))
            print(f"Copied dashboard.html to temp directory")
        else:
            print(f"ERROR: Could not find dashboard.html at {dashboard_src}")
            # Create a simple default dashboard
            default_html = """<!DOCTYPE html>
<html>
<head>
    <title>WSS Exam Them - Teacher Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WSS Exam Them - Teacher Dashboard</h1>
        <div class="info">
            <p>Dashboard loaded successfully!</p>
            <p>Events will be logged here.</p>
        </div>
    </div>
</body>
</html>"""
            with open(os.path.join(temp_dir, DASHBOARD_FILE), "w") as f:
                f.write(default_html)
    except Exception as e:
        print(f"Error copying dashboard: {e}")
    
    # Create empty log file
    log_path = os.path.join(temp_dir, LOG_FILE)
    if not os.path.exists(log_path):
        with open(log_path, "w") as f:
            json.dump([], f)
    
    # Start server
    server_thread = threading.Thread(target=start_server, args=(port, temp_dir), daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(1.5)
    
    # Check if server is running
    url = f"http://{ip}:{port}/"
    print(f"\n{'='*60}")
    print(f"{APP_NAME} is running!")
    print(f"Dashboard URL: {url}")
    print(f"Local URL: http://localhost:{port}/")
    print(f"LAN URL: http://{ip}:{port}/")
    print(f"{'='*60}\n")
    
    # Try to open browser
    try:
        webbrowser.open(url)
        print("Browser opened successfully!")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print(f"Please manually open: {url}")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        # Clean up temp directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except:
            pass
        sys.exit(0)