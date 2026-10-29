#!/usr/bin/env python3
"""Prepare only a locally downloaded Flow master; never calls a generation/API service."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
master = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / "art/flow-cinematics/zero-bell-reference.mp4"
if not master.is_file():
    raise SystemExit(f"Missing Flow master: {master}. Download the reference video in Flow first.")
probe = json.loads(subprocess.check_output(["/usr/local/bin/ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(master)]))
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
if not 6 <= float(probe["format"]["duration"]) <= 12 or video["width"] < video["height"]:
    raise SystemExit("Expected the landscape 8-second reference shot. Review the input before encoding.")
web = root / "public/video/resonance"
web.mkdir(parents=True, exist_ok=True)
output = web / "zero-bell-opening.mp4"
poster = web / "zero-bell-opening.jpg"
subprocess.run(["/usr/local/bin/ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(master), "-map", "0:v:0", "-map", "0:a?", "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(output)], check=True)
subprocess.run(["/usr/local/bin/ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "1", "-i", str(output), "-frames:v", "1", "-q:v", "2", str(poster)], check=True)
receipt_path = root / "art/flow-cinematics/receipt.json"
receipt = json.loads(receipt_path.read_text())
receipt["status"] = "downloaded-and-encoded-awaiting-browser-qa"
receipt["files"] = [{"path": str(p.relative_to(root)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size} for p in [master, output, poster]]
receipt["probe"] = {"duration": probe["format"]["duration"], "width": video["width"], "height": video["height"], "hasAudio": any(s["codec_type"] == "audio" for s in probe["streams"])}
receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
(root / "src/client/argon/opening-media.ts").write_text("// Local Flow master and web derivatives are recorded in art/flow-cinematics/receipt.json.\nexport const openingAvailable = true;\n")
print("Encoded local Flow video. Review frames/audio, then verify opening playback, skip and fallback in browser.")
