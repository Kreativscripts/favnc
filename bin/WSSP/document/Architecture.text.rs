[ Capture Process ]
  - Camera / IP stream
  - Fixed FPS (30)
  - Zero AI
  - Writes to shared ring buffer

[ Detection Process ]
  - Reads frames (decimated)
  - YOLO + optical flow
  - Emits threat events

[ Recorder Process ]
  - Continuous video + audio
  - Event-indexed
  - JSON-encrypted container

[ UI Server Process ]
  - WebSocket (NOT MJPEG)
  - Live frames
  - Overlay metadata
  - Operator controls
