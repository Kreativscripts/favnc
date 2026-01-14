from ai.registry import load_models, run_inference

load_models()

def analyze(frame):
    return run_inference(frame)
