from ultralytics import YOLO
import cv2, time, numpy as np

model = YOLO("yolov8n.pt")
prev_gray = None

def detect_loop(frame_q, event_q):
    global prev_gray
    last = 0

    while True:
        ts, frame = frame_q.get()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        speed_alert = False
        if prev_gray is not None:
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None,
                0.5, 3, 15, 3, 5, 1.2, 0
            )
            mag, _ = cv2.cartToPolar(flow[...,0], flow[...,1])
            if mag.mean() > 4.0:
                speed_alert = True

        prev_gray = gray

        if time.time() - last < 0.12:
            continue
        last = time.time()

        results = model(frame, conf=0.4)[0]

        for b in results.boxes:
            if int(b.cls[0]) == 0:
                event = {
                    "t": ts,
                    "type": "person",
                    "box": b.xyxy[0].tolist(),
                    "speed": speed_alert
                }
                if speed_alert:
                    event["threat"] = 1
                event_q.put(event)
