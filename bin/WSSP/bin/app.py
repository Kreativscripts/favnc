import multiprocessing as mp
from engine.capture import capture_loop
from engine.detect import detect_loop
from engine.record import record_loop
from engine.ui import ui_server_start

if __name__ == "__main__":
    mp.set_start_method("spawn")

    frame_q = mp.Queue(maxsize=60)
    event_q = mp.Queue()
    record_q = mp.Queue()

    procs = [
        mp.Process(target=capture_loop, args=(frame_q,)),
        mp.Process(target=detect_loop, args=(frame_q, event_q)),
        mp.Process(target=record_loop, args=(frame_q, event_q, record_q)),
        mp.Process(target=ui_server_start, args=(frame_q, event_q)),
    ]

    for p in procs:
        p.start()

    for p in procs:
        p.join()
