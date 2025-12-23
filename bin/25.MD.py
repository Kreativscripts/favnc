import subprocess, json, os, math, sys
from pathlib import Path

# ==========================================
# CONFIG (YOUR FFmpeg PATH IS SET HERE)
# ==========================================
FFMPEG_BIN = r"F:\TTSFile\bin"  # <-- YOUR ffmpeg / ffprobe folder
TARGET_MB = 24.5
TARGET_BYTES = int(TARGET_MB * 1024 * 1024)


def ff_cmd(name: str) -> str:
    """Return full path to ffmpeg/ffprobe using your bin folder."""
    return str(Path(FFMPEG_BIN) / (name + ".exe"))


def ffprobe_duration(path: str) -> float:
    cmd = [
        ff_cmd("ffprobe"),
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        path
    ]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, check=True)
    except FileNotFoundError:
        raise RuntimeError("ffprobe not found in FFMPEG_BIN. Check your path.")
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"ffprobe error: {e.stderr}")

    info = json.loads(p.stdout)
    return float(info["format"]["duration"])


def trim_to_target_size(input_path: str, out_path: str | None = None, target_bytes: int = TARGET_BYTES):
    src = Path(input_path)
    if not src.is_file():
        raise FileNotFoundError(f"File not found: {src}")

    size = src.stat().st_size
    print(f"Input: {src}")
    print(f"Current size: {size/1024/1024:.2f} MB")

    if size <= target_bytes:
        print(f"Size already <= {TARGET_MB} MB — no trim needed.")
        return str(src)

    duration = ffprobe_duration(str(src))
    print(f"Duration: {duration:.2f} seconds")

    bytes_per_sec = size / duration
    max_duration = target_bytes / bytes_per_sec

    if max_duration <= 1:
        raise RuntimeError("Video bitrate too high — cannot trim to <=24.5MB cleanly.")

    # Floor to 2 decimal places for ffmpeg
    max_duration = math.floor(max_duration * 100) / 100
    print(f"Trimming to {max_duration:.2f} seconds to fit under {TARGET_MB} MB...")

    if out_path is None:
        out_path = src.with_name(src.stem + "_trimmed" + src.suffix)
    out = Path(out_path)

    cmd = [
        ff_cmd("ffmpeg"),
        "-y",
        "-i", str(src),
        "-t", str(max_duration),
        "-c", "copy",
        str(out)
    ]

    print("Running:", " ".join(cmd))

    try:
        p = subprocess.run(cmd)
    except FileNotFoundError:
        raise RuntimeError("ffmpeg not found. Verify FFMPEG_BIN is correct.")
    if p.returncode != 0:
        raise RuntimeError("ffmpeg failed.")

    new_size = out.stat().st_size
    print(f"Output: {out}")
    print(f"New size: {new_size/1024/1024:.2f} MB")

    return str(out)


def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = input("Enter path to video file: ").strip()

    try:
        trimmed = trim_to_target_size(path)
        print("\nDone!")
        print("Trimmed File:", trimmed)
    except Exception as e:
        print("\nError:", e)


if __name__ == "__main__":
    main()
