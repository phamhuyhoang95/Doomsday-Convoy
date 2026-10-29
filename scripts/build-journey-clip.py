"""Compose a short travel shot from the existing alpha bus and existing painted scenery.
No AI-video claim or replacement of A1/A2 masters. Offline ffmpeg only.
"""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BUS = ROOT / 'public/art/a2/vehicle.bus.png'
OUT = ROOT / 'public/video/journey/convoy-departure.mp4'
OUT.parent.mkdir(parents=True, exist_ok=True)
BACKGROUND = ROOT / 'public/art/a2/location.service.jpg'
graph = '[0:v]crop=1280:720:x=160-25*t:y=130,eq=brightness=-0.035[bg];[1:v]scale=650:-1,format=rgba[bus];[bg][bus]overlay=x=390-95*t:y=250+2*sin(t*22):shortest=1,noise=alls=2:allf=t+u,vignette=PI/5,fade=t=in:d=0.35,fade=t=out:st=4.75:d=0.45,format=yuv420p[out]'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-loop','1','-framerate','24','-i',str(BACKGROUND),'-loop','1','-framerate','24','-i',str(BUS),'-filter_complex',graph,'-map','[out]','-t','5.2','-an','-c:v','libx264','-preset','medium','-crf','23','-movflags','+faststart','-y',str(OUT)],check=True)
poster = OUT.with_suffix('.jpg')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss','1.6','-i',str(OUT),'-frames:v','1','-q:v','3','-y',str(poster)],check=True)
files = {str(p.relative_to(ROOT)): {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [BUS,BACKGROUND,OUT,poster]}
(ROOT/'art/journey/clip-receipt.json').write_text(json.dumps({'kind':'offline-motion-composition','durationSeconds':5.2,'fps':24,'size':[1280,720],'sources':'A1/A2 alpha bus and service backdrop, pan/suspension/fades/grain; no new raster generation or AI video service','script':'scripts/build-journey-clip.py','files':files},ensure_ascii=False,indent=2)+'\n')
print(f'Built {OUT.stat().st_size} byte travel clip')
