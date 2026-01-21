import subprocess
import os
import math

ffmpeg = r"F:\TTSFile\bin\ffmpeg.exe"
ffprobe = r"F:\TTSFile\bin\ffprobe.exe"

input_video = r"C:\Users\patro\Downloads\Timeline_1eee.mp4"
output_video = r"C:\Users\patro\Downloads\Timeline_1eee_25mb.mp4"

target_size_mb = 25
target_size_bits = target_size_mb * 8 * 1024 * 1024

cmd_duration = [
    ffprobe, "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    input_video
]

duration = float(subprocess.check_output(cmd_duration).decode().strip())

audio_bitrate = 128000
video_bitrate = math.floor((target_size_bits / duration) - audio_bitrate)

if video_bitrate <= 0:
    raise ValueError("Target size too small for this video length")

cmd_encode = [
    ffmpeg,
    "-i", input_video,
    "-c:v", "libx264",
    "-b:v", str(video_bitrate),
    "-maxrate", str(video_bitrate),
    "-bufsize", str(video_bitrate * 2),
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    output_video
]

subprocess.run(cmd_encode, check=True)

final_size = os.path.getsize(output_video) / (1024 * 1024)
print(f"Final size: {final_size:.2f} MB")
