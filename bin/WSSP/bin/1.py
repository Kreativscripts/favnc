import cv2, os, time, numpy as np, sounddevice as sd
from scipy.io.wavfile import write
from ultralytics import YOLO
from threading import Thread

os.makedirs("videos/session", exist_ok=True)
os.makedirs("videos/suspicious", exist_ok=True)
os.makedirs("pics/session", exist_ok=True)
os.makedirs("pics/suspicious", exist_ok=True)
os.makedirs("audio", exist_ok=True)

model = YOLO("models/yolov8n.pt")
face = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

cap = cv2.VideoCapture(0)
w = int(cap.get(3))
h = int(cap.get(4))
fps = 20

ts = int(time.time())
session_vid = cv2.VideoWriter(f"videos/session/{ts}.mp4",
                              cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

audio_data = []

def record_audio():
    global audio_data
    audio_data = sd.rec(int(60 * 60 * 44100), samplerate=44100, channels=1)
    sd.wait()

Thread(target=record_audio, daemon=True).start()

prev = {}
sus_writer = None
sus_timer = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face.detectMultiScale(gray, 1.3, 5)

    results = model(frame, conf=0.4)[0]
    threat_active = False
    threat_box = None

    current = {}

    for box in results.boxes:
        cls = int(box.cls[0])
        name = model.names[cls]
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        current[(x1, y1, x2, y2)] = (cx, cy)

        threat = False
        if name in ["knife", "gun"]:
            threat = True

        if name == "person":
            for p in prev.values():
                if np.linalg.norm(np.array(p) - np.array((cx, cy))) > 80:
                    threat = True

        color = (0, 0, 255) if threat else (255, 255, 255)

        if threat:
            threat_active = True
            threat_box = (x1, y1, x2, y2)
            cv2.imwrite(f"pics/suspicious/{int(time.time())}.png", frame[y1:y2, x1:x2])

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    for (x, y, fw, fh) in faces:
        cv2.rectangle(frame, (x, y), (x + fw, y + fh), (255, 255, 255), 1)

    if threat_active and threat_box:
        x1, y1, x2, y2 = threat_box
        sharp = frame[y1:y2, x1:x2].copy()
        frame = cv2.GaussianBlur(frame, (45, 45), 0)
        frame[y1:y2, x1:x2] = sharp

        if sus_writer is None:
            sus_writer = cv2.VideoWriter(
                f"videos/suspicious/{int(time.time())}.mp4",
                cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h)
            )
            sus_timer = time.time()

        sus_writer.write(frame)

    if sus_writer and time.time() - sus_timer > 5:
        sus_writer.release()
        sus_writer = None

    session_vid.write(frame)
    cv2.imshow("Threat Detector", frame)

    if cv2.waitKey(1) & 0xFF == ord("p"):
        cv2.imwrite(f"pics/session/{int(time.time())}.png", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

    prev = current

cap.release()
session_vid.release()
if sus_writer:
    sus_writer.release()

write(f"audio/{ts}.wav", 44100, audio_data)
cv2.destroyAllWindows()
