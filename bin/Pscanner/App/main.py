# ===========================================
# ==================Imports===================
# ===========================================
import json
import os
import cv2
import logging
import numpy as np
from datetime import datetime
from flask import Flask, Response, render_template_string

# ===========================================
# ================Paths & Setup===============
# ===========================================
project_root = os.path.dirname(os.path.abspath(__file__))
logs_path = os.path.join(project_root, '..', 'Logs', 'events.log')
logging.basicConfig(filename=logs_path, level=logging.INFO)

with open(os.path.join(project_root, '..', 'Config', 'settings.json')) as f:
    settings = json.load(f)
with open(os.path.join(project_root, '..', 'Config', 'thresholds.json')) as f:
    thresholds = json.load(f)
with open(os.path.join(project_root, '..', 'Config', 'cameras.json')) as f:
    cameras = json.load(f)['cameras']

settings['storage_root'] = os.path.join(project_root, '..')

app = Flask(__name__)

# ===========================================
# ==============Camera Manager================
# ===========================================
class CameraManager:
    def __init__(self, cameras):
        self.caps = {}
        for cam in cameras:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not cap.isOpened():
                print(f"Error: Cannot open camera for {cam['id']}")
            self.caps[cam['id']] = cap

    def get_frames(self):
        frames = {}
        for cam_id, cap in self.caps.items():
            ret, frame = cap.read()
            if ret:
                frames[cam_id] = frame
        return frames

# ===========================================
# ================AI Engine===================
# ===========================================
class AIEngine:
    def __init__(self, thresholds):
        self.thresholds = thresholds
        self.input_size = (640, 640)
        self.conf_thres = 0.25
        self.iou_thres = 0.45
        self.classes = ['knife', 'gun']  # adjust if your model has more

        model_path = os.path.join(project_root, '..', 'Bin', 'models', 'best.onnx')
        try:
            self.net = cv2.dnn.readNetFromONNX(model_path)
            print("Loaded custom ONNX model:", model_path)
        except Exception as e:
            print("ONNX load failed:", e)
            print("Falling back to yolov8n.pt")
            from ultralytics import YOLO
            self.net = YOLO("yolov8n.pt")
            self.net = self.net.model  # hack to mimic dnn.Net
            self.is_ultralytics = True
        else:
            self.is_ultralytics = False

    def process_frame(self, frame):
        if self.is_ultralytics:
            results = self.net(frame)[0]
            detections = []
            for box in results.boxes:
                conf = float(box.conf)
                if conf < self.conf_thres:
                    continue
                cls_id = int(box.cls)
                label = results.names[cls_id]
                if label == 'knife' and conf >= self.thresholds.get('knife_detection_confidence', 0.75):
                    detections.append({'class': 'knife', 'conf': conf, 'box': box.xywh[0].tolist(), 'label': label})
            return detections

        # ONNX post-processing
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, self.input_size, swapRB=True, crop=False)
        self.net.setInput(blob)
        outputs = self.net.forward(self.net.getUnconnectedOutLayersNames())

        detections = []
        boxes = []
        confs = []
        class_ids = []

        h, w = frame.shape[:2]
        output = outputs[0].transpose(0, 2, 1)  # [1, 84, N] -> [1, N, 84]

        for row in output[0]:
            conf = row[4]  # objectness or max class conf
            if conf < self.conf_thres:
                continue
            scores = row[4:]
            class_id = np.argmax(scores)
            class_conf = scores[class_id]
            total_conf = conf * class_conf
            if total_conf < self.conf_thres:
                continue

            cx, cy, bw, bh = row[0:4]
            x = int((cx - bw/2) * w)
            y = int((cy - bh/2) * h)
            width = int(bw * w)
            height = int(bh * h)

            label = self.classes[class_id] if class_id < len(self.classes) else f'class_{class_id}'
            cls_type = 'knife' if 'knife' in label.lower() else 'gun' if any(g in label.lower() for g in ['gun', 'handgun', 'rifle']) else 'suspicious'

            if cls_type in ['knife', 'gun'] and total_conf >= self.thresholds.get(f'{cls_type}_detection_confidence', 0.75):
                detections.append({'class': cls_type, 'conf': total_conf, 'box': [x, y, width, height], 'label': label})
            elif total_conf >= self.thresholds.get('suspicious_pattern_confidence', 0.60):
                detections.append({'class': 'suspicious', 'conf': total_conf, 'box': [x, y, width, height], 'label': label})

        # NMS
        if detections:
            indices = cv2.dnn.NMSBoxes([d['box'] for d in detections], [d['conf'] for d in detections], self.conf_thres, self.iou_thres)
            detections = [detections[i] for i in indices.flatten()]

        return detections

# ===========================================
# =============Decision Engine================
# ===========================================
class DecisionEngine:
    def __init__(self, thresholds):
        self.thresholds = thresholds

    def make_decision(self, detections):
        if not detections:
            return 'IGNORE'

        max_conf = max(d['conf'] for d in detections)
        has_weapon = any(d['class'] in ['knife', 'gun'] for d in detections)

        if has_weapon and max_conf >= 0.75:
            return 'DETECTED'
        if any(d['class'] == 'suspicious' for d in detections) and max_conf >= 0.60:
            return 'SUSPICIOUS'
        return 'IGNORE'

# Recorder and UI classes unchanged from previous (copy them in if needed; omitted here for brevity but include in your file)

# ... (paste Recorder and UI from your last working version here)

# ===========================================
# =================Flask Routes===============
# ===========================================
camera_manager = CameraManager(cameras)
ai_engine = AIEngine(thresholds)
decision_engine = DecisionEngine(thresholds)
recorder = Recorder(settings)
ui = UI(settings)

@app.route('/')
def index():
    return render_template_string('''[same HTML as before - copy from previous response]''')

def gen_frames(cam_id):
    last_decision = 'NORMAL'
    while True:
        frames = camera_manager.get_frames()
        frame = frames.get(cam_id)
        if frame is None:
            continue

        try:
            detections = ai_engine.process_frame(frame)
            decision = decision_engine.make_decision(detections)

            if decision != 'IGNORE':
                if decision == 'DETECTED':
                    recorder.record_video(cam_id, frame, decision, detections)
                    frame = recorder._overlay(frame, cam_id, detections, 'RED')
                elif decision == 'SUSPICIOUS':
                    recorder.capture_images(cam_id, frame, decision, detections)
                    frame = recorder._overlay(frame, cam_id, detections, 'YELLOW')

                # Only print on change or event
                if decision != last_decision:
                    ui.update(cam_id, decision, detections)
                    last_decision = decision
        except Exception as e:
            print("Frame processing error:", e)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(cameras[0]['id']),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print(f"Starting {settings['system_name']} - open http://127.0.0.1:5000/ in browser")
    print("If connection fails: check if port 5000 is free, allow Python through firewall, run as admin if needed")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)