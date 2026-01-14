from ultralytics import YOLO
from ai.base import AIModel
from ai.utils import resource_path

class PersonModel(AIModel):
    name = "person"
    classes = ["person"]

    def load(self):
        self.model = YOLO(
            resource_path("bin/ai/models/yolov8n.pt")
        )

    def infer(self, frame):
        out = []
        r = self.model(frame, conf=0.4)[0]
        for b in r.boxes:
            if int(b.cls[0]) == 0:
                out.append({
                    "type": "person",
                    "box": b.xyxy[0].tolist(),
                    "threat": 0
                })
        return out
