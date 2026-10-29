"""Offline derivative only. Preserve the downloaded Gemini master; requires ffmpeg."""
from array import array
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/argon-o1/audio/market-combat-gemini-v1.mp3"
DESTINATION = ROOT / "public/audio/argon/market-combat.mp3"
RATE = 44100
CHANNELS = 2
OVERLAP = 4 * RATE * CHANNELS

with tempfile.TemporaryDirectory(prefix="last-convoy-audio-") as work:
    decoded = Path(work) / "decoded.wav"
    loop = Path(work) / "loop.wav"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", "4",
        "-i", str(SOURCE), "-t", "80", "-ar", str(RATE), "-ac", "2",
        "-c:a", "pcm_s16le", str(decoded),
    ], check=True)
    with wave.open(str(decoded), "rb") as source:
        samples = array("h", source.readframes(source.getnframes()))
    if len(samples) < OVERLAP * 3:
        raise ValueError("Source is too short to prepare the loop")
    head, tail = samples[:OVERLAP], samples[-OVERLAP:]
    # Begin at source +4s; append a tail→head seam. The end then joins that same +4s.
    result = samples[OVERLAP:-OVERLAP]
    for index, (last, first) in enumerate(zip(tail, head)):
        weight = (index // CHANNELS) / (OVERLAP // CHANNELS - 1)
        result.append(round(last * (1 - weight) + first * weight))
    with wave.open(str(loop), "wb") as output:
        output.setnchannels(CHANNELS)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(result.tobytes())
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(loop),
        "-af", "loudnorm=I=-20:TP=-2:LRA=10", "-c:a", "libmp3lame",
        "-b:a", "160k", "-y", str(DESTINATION),
    ], check=True)
    print(f"Prepared {len(result) / CHANNELS / RATE:.2f}s loop: {DESTINATION}")
