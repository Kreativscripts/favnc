import socket
import json
import os
import sys
import time
import subprocess
import threading
import shlex
from datetime import datetime
import urllib.request
import urllib.error

# ---------------- CONFIG ----------------
CHECK_INTERVAL = 2  # seconds
APP_NAME = "WSS Exam Them - STUDENT"
PORT_RANGE = (20000, 45000)
SERVER_URL = "http://{ip}:{port}/log"
# ---------------------------------------

def clear_screen():
    """Clear console screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print application header"""
    clear_screen()
    print("=" * 60)
    print(f"🧑‍🎓 {APP_NAME}")
    print("=" * 60)
    print()

def get_input(prompt, default="", allow_empty=False):
    """Get user input with handling for Ctrl+C"""
    try:
        if default:
            user_input = input(f"{prompt} [{default}]: ").strip()
        else:
            user_input = input(f"{prompt}: ").strip()
        
        if not user_input and default:
            return default
        elif not user_input and not allow_empty:
            # Show the prompt again for required fields
            print("Please enter a value or press Enter to use default.")
            return get_input(prompt, default, allow_empty)
        else:
            return user_input
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit()
    except EOFError:
        print("\n\nExiting...")
        sys.exit()

def validate_ip(ip):
    """Validate IP address format"""
    parts = ip.split('.')
    if len(parts) != 4:
        return False
    for part in parts:
        if not part.isdigit():
            return False
        num = int(part)
        if num < 0 or num > 255:
            return False
    return True

def find_teacher_server(teacher_ip):
    """Find teacher server by scanning ports"""
    print("\n🔍 Scanning for teacher server... (this may take 10-20 seconds)")
    found_ports = []
    
    def scan_port(port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.05)
                result = s.connect_ex((teacher_ip, port))
                if result == 0:
                    # Also try HTTP to confirm it's our server
                    try:
                        urllib.request.urlopen(f"http://{teacher_ip}:{port}/", timeout=1)
                        found_ports.append(port)
                    except:
                        pass
        except:
            pass
    
    # Create threads for scanning
    threads = []
    for port in range(PORT_RANGE[0], PORT_RANGE[1], 100):
        thread = threading.Thread(target=scan_port, args=(port,))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads
    for thread in threads:
        thread.join()
    
    if found_ports:
        print(f"✅ Found teacher server on port(s): {', '.join(map(str, found_ports))}")
        return found_ports[0]  # Return first found port
    
    print("❌ Could not find teacher server automatically")
    return None

def send_event(teacher_ip, teacher_port, event_data):
    """Send event to teacher server using HTTP POST"""
    url = f"http://{teacher_ip}:{teacher_port}/log"
    
    # Add student info to event
    event_data.update({
        "student_id": os.getenv("USERNAME", "Unknown"),
        "student_computer": os.getenv("COMPUTERNAME", "Unknown"),
        "student_ip": socket.gethostbyname(socket.gethostname()),
        "timestamp": datetime.now().isoformat(),
        "server_time": datetime.now().strftime("%H:%M:%S")
    })
    
    try:
        # Create HTTP request
        req = urllib.request.Request(url)
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        data = json.dumps(event_data).encode('utf-8')
        req.add_header('Content-Length', str(len(data)))
        
        # Send request
        with urllib.request.urlopen(req, data=data, timeout=5) as response:
            if response.status == 200:
                return True
    except urllib.error.URLError as e:
        # Server might be down - silent fail
        pass
    except Exception as e:
        # Any other error - silent fail
        pass
    
    return False

def monitor_exam(teacher_ip, teacher_port, exam_path, exam_args):
    """Monitor and send heartbeat events"""
    last_success = time.time()
    consecutive_fails = 0
    heartbeat_count = 0
    
    print("\n📡 Starting monitoring...")
    print("   Sending heartbeats to teacher every 2 seconds")
    print("   Press Ctrl+C to stop\n")
    
    # Initial event: exam started
    print("📤 Sending 'exam_started' event...")
    send_event(teacher_ip, teacher_port, {
        "action": "exam_started",
        "exam_path": exam_path,
        "exam_args": exam_args,
        "message": f"Student started exam: {os.path.basename(exam_path)}"
    })
    
    while True:
        try:
            heartbeat_count += 1
            event_data = {
                "action": "heartbeat",
                "heartbeat_number": heartbeat_count,
                "status": "active",
                "uptime_seconds": int(time.time() - last_success)
            }
            
            if heartbeat_count % 10 == 0:
                print(f"💓 Sent heartbeat #{heartbeat_count} to teacher")
            
            success = send_event(teacher_ip, teacher_port, event_data)
            
            if success:
                if consecutive_fails > 0:
                    print(f"✅ Connection restored to teacher server")
                    consecutive_fails = 0
                last_success = time.time()
            else:
                consecutive_fails += 1
                if consecutive_fails == 3:
                    print("⚠️  Warning: Cannot reach teacher server")
                elif consecutive_fails > 3:
                    print(f"❌ Lost connection to teacher ({consecutive_fails} consecutive fails)")
            
            time.sleep(CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            # Send exit event
            print("\n📤 Sending 'exam_stopped' event...")
            send_event(teacher_ip, teacher_port, {
                "action": "exam_stopped",
                "message": "Student manually stopped monitoring",
                "total_heartbeats": heartbeat_count
            })
            break
        except Exception as e:
            # Log error but continue
            time.sleep(CHECK_INTERVAL)

def launch_exam_application(exam_path, exam_args=""):
    """Launch the exam application"""
    try:
        # Remove quotes if present
        exam_path = exam_path.strip('"\'')
        
        # Check if file exists
        if not os.path.exists(exam_path):
            # Try to find it in PATH
            if not os.path.isabs(exam_path):
                for path_dir in os.environ.get("PATH", "").split(os.pathsep):
                    full_path = os.path.join(path_dir, exam_path)
                    if os.path.exists(full_path):
                        exam_path = full_path
                        break
        
        if not os.path.exists(exam_path):
            print(f"❌ Error: Cannot find application at: {exam_path}")
            return False
        
        # Prepare command
        if exam_args and exam_args.lower() != "enter":
            # Split arguments properly
            try:
                args = shlex.split(exam_args)
                cmd = [exam_path] + args
            except:
                cmd = [exam_path]
        else:
            cmd = [exam_path]
        
        print(f"🚀 Launching: {exam_path}")
        if exam_args and exam_args.lower() != "enter":
            print(f"   Arguments: {exam_args}")
        
        # Launch application
        if os.name == 'nt':  # Windows
            # Use CREATE_NEW_PROCESS_GROUP to allow proper termination
            process = subprocess.Popen(
                cmd,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print(f"   Process ID: {process.pid}")
        else:  # Unix/Linux/Mac
            process = subprocess.Popen(cmd)
        
        # Wait a moment to ensure app launches
        time.sleep(1.5)
        
        # Check if process is still running
        if process.poll() is not None:
            print(f"⚠️  Application exited immediately with code: {process.returncode}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error launching application: {e}")
        return False

def get_exam_path_interactive():
    """Interactive file browser for selecting exam application"""
    print("\n📁 Select exam application:")
    print("1. Enter path manually")
    print("2. Browse common locations")
    
    choice = get_input("Choice", "1")
    
    if choice == "1":
        while True:
            path = get_input("Full path to application (or drag & drop file here)")
            path = path.strip('"\'')  # Remove quotes
            
            if os.path.exists(path):
                return path
            else:
                print("❌ File not found. Please try again.")
    else:
        # Common locations to check
        common_paths = []
        
        # Windows common locations
        if os.name == 'nt':
            common_paths = [
                "C:\\Program Files",
                "C:\\Program Files (x86)",
                os.path.expanduser("~\\Desktop"),
                os.path.expanduser("~\\Documents"),
                os.path.expanduser("~\\Downloads"),
                os.path.expanduser("~\\AppData\\Local"),
            ]
        
        # Unix-like common locations
        else:
            common_paths = [
                "/usr/bin",
                "/usr/local/bin",
                os.path.expanduser("~/Desktop"),
                os.path.expanduser("~/Documents"),
                os.path.expanduser("~/Downloads"),
            ]
        
        print("\nCommon locations:")
        valid_paths = []
        for i, location in enumerate(common_paths, 1):
            if os.path.exists(location):
                print(f"  {i}. {location}")
                valid_paths.append(location)
        
        loc_choice = get_input("\nEnter number or path", allow_empty=True)
        if loc_choice.isdigit():
            idx = int(loc_choice) - 1
            if 0 <= idx < len(valid_paths):
                selected = valid_paths[idx]
                print(f"📁 Browsing: {selected}")
                
                # Show files in directory
                try:
                    files = [f for f in os.listdir(selected) 
                            if f.lower().endswith(('.exe', '.app', '.bat', '.sh', '.msi')) or 
                            os.path.isfile(os.path.join(selected, f))]
                    
                    if files:
                        print("\nAvailable files (first 20):")
                        for i, file in enumerate(files[:20], 1):
                            full_path = os.path.join(selected, file)
                            if os.path.isfile(full_path):
                                print(f"  {i}. {file}")
                        
                        file_choice = get_input("\nEnter number or filename", allow_empty=True)
                        if file_choice.isdigit():
                            idx = int(file_choice) - 1
                            if 0 <= idx < len(files):
                                return os.path.join(selected, files[idx])
                        elif file_choice:
                            return os.path.join(selected, file_choice)
                        else:
                            print("❌ No file selected.")
                            return get_exam_path_interactive()
                    else:
                        print("❌ No files found in this directory.")
                        return get_exam_path_interactive()
                except PermissionError:
                    print("❌ Permission denied to access this directory.")
                    return get_exam_path_interactive()
                except:
                    print("❌ Could not list directory contents.")
                    return get_exam_path_interactive()
        
        # Fall back to manual input
        return get_exam_path_interactive()

# ---------------- MAIN ----------------
def main():
    print_header()
    
    # Welcome and permission
    print("Welcome to the Student Exam Monitoring System!")
    print("This program will:")
    print("  1. Launch your exam application")
    print("  2. Send periodic status updates to your teacher")
    print("  3. Notify teacher when you start/stop the exam\n")
    
    perm = get_input("Do you allow this program to monitor your exam? (yes/no)", "yes")
    if perm.lower() not in ['yes', 'y']:
        print("❌ Permission denied. Exiting.")
        sys.exit()
    
    # Teacher connection
    print("\n" + "=" * 40)
    print("TEACHER CONNECTION SETUP")
    print("=" * 40)
    
    # Get teacher IP
    teacher_ip = None
    while not teacher_ip:
        ip_input = get_input("Teacher server IP address", "192.168.0.2")
        
        if validate_ip(ip_input):
            teacher_ip = ip_input
        else:
            print("❌ Invalid IP address format. Please use format like 192.168.0.2")
    
    # Get teacher port
    teacher_port = None
    while not teacher_port:
        port_input = get_input("Teacher port (press Enter to auto-detect)", "")
        
        if port_input:
            if port_input.isdigit():
                teacher_port = int(port_input)
                
                # Test connection
                print(f"🔌 Testing connection to {teacher_ip}:{teacher_port}...")
                try:
                    urllib.request.urlopen(f"http://{teacher_ip}:{teacher_port}/", timeout=2)
                    print("✅ Connection successful!")
                except Exception as e:
                    print(f"❌ Cannot connect to teacher server: {e}")
                    retry = get_input("Try auto-detection instead? (yes/no)", "yes")
                    if retry.lower() in ['yes', 'y']:
                        teacher_port = find_teacher_server(teacher_ip)
                    else:
                        teacher_port = None
            else:
                print("❌ Port must be a number")
        else:
            teacher_port = find_teacher_server(teacher_ip)
    
    if not teacher_port:
        print("❌ Could not connect to teacher server. Exiting.")
        sys.exit()
    
    print(f"\n✅ Connected to teacher at: http://{teacher_ip}:{teacher_port}")
    
    # Exam application
    print("\n" + "=" * 40)
    print("EXAM APPLICATION SETUP")
    print("=" * 40)
    
    exam_path = get_exam_path_interactive()
    
    # Get additional arguments
    print("\n💡 Tip: If you need to pass arguments to your application, enter them now.")
    print("   Example: --fullscreen --mode=exam")
    exam_args = get_input("Additional arguments (optional, press Enter to skip)", "", allow_empty=True)
    
    # Launch exam
    print("\n" + "=" * 40)
    print("LAUNCHING EXAM")
    print("=" * 40)
    
    if not launch_exam_application(exam_path, exam_args):
        print("❌ Failed to launch exam application. Exiting.")
        sys.exit()
    
    # Start monitoring
    try:
        monitor_exam(teacher_ip, teacher_port, exam_path, exam_args)
    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n\n❌ Error in monitoring: {e}")
    
    print("\n" + "=" * 40)
    print("MONITORING STOPPED")
    print("=" * 40)
    print("Thank you for using WSS Exam Them!")
    time.sleep(3)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit()