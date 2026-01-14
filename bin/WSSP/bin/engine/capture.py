import cv2, time

def capture_loop(frame_q):
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FPS, 30)

    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        if frame_q.full():
            frame_q.get()
        frame_q.put((time.time(), frame))
