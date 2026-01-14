import importlib, pkgutil
from ai.base import AIModel

models = {}

def load_models():
    for m in pkgutil.iter_modules(__path__):
        if m.name == "models":
            pkg = importlib.import_module("ai.models")
            for sub in pkgutil.iter_modules(pkg.__path__):
                mod = importlib.import_module(f"ai.models.{sub.name}")
                for obj in mod.__dict__.values():
                    if isinstance(obj, type) and issubclass(obj, AIModel) and obj is not AIModel:
                        inst = obj()
                        inst.load()
                        models[inst.name] = inst

def run_inference(frame):
    results = []
    for m in models.values():
        results.extend(m.infer(frame))
    return results
