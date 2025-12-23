import subprocess, json, os, math, tempfile

ffmpeg=r"F:\TTSFile\bin\ffmpeg.exe"
ffprobe=r"F:\TTSFile\bin\ffprobe.exe"

inp=r"F:\Kyler\m\A_Silent_Voice.mp4"
out=r"F:\Kyler\m\A_Silent_Voice_450MB.mp4"

target_mb=450
target_bits=target_mb*1024*1024*8

p=subprocess.run([ffprobe,"-v","error","-show_format","-show_streams","-of","json",inp],capture_output=True,text=True)
j=json.loads(p.stdout)

duration=float(j["format"]["duration"])

audio_stream=None
for s in j.get("streams",[]):
    if s.get("codec_type")=="audio":
        audio_stream=s
        break

audio_bps=0
if audio_stream:
    br=audio_stream.get("bit_rate") or audio_stream.get("tags",{}).get("BPS")
    try:
        audio_bps=int(float(br))
    except:
        audio_bps=0

if audio_bps<=0:
    audio_bps=192000

target_total_bps=int(target_bits/duration)
video_bps=max(300_000, target_total_bps - audio_bps)

passlog=os.path.join(tempfile.gettempdir(),"ffmpeg_450mb_passlog")

cmd1=[
    ffmpeg,"-y","-hide_banner","-loglevel","error",
    "-i",inp,
    "-map","0:v:0","-map","0:a:0?",
    "-r","24","-fps_mode","cfr",
    "-c:v","libx264","-preset","ultrafast",
    "-b:v",str(video_bps),"-maxrate",str(video_bps),"-bufsize",str(video_bps*2),
    "-c:a","copy",
    "-pass","1","-passlogfile",passlog,
    "-f","mp4","NUL"
]

cmd2=[
    ffmpeg,"-y","-hide_banner","-loglevel","error",
    "-i",inp,
    "-map","0:v:0","-map","0:a:0?",
    "-r","24","-fps_mode","cfr",
    "-c:v","libx264","-preset","ultrafast",
    "-b:v",str(video_bps),"-maxrate",str(video_bps),"-bufsize",str(video_bps*2),
    "-c:a","copy",
    "-movflags","+faststart",
    "-pass","2","-passlogfile",passlog,
    out
]

subprocess.run(cmd1, check=True)
subprocess.run(cmd2, check=True)
