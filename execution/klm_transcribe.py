#!/usr/bin/env python3
"""
Word-level transcript of a sermon (or any dropped-in video) with faster-whisper.

Writes <out>.json: {"duration": seconds, "words": [{"w": "word", "s": 12.34, "e": 12.61}, ...]}
Progress is appended to <out>.log so a background run can be polled.

Runs in the Higgsfield sandbox (faster-whisper + ffmpeg are preinstalled).
A 90-minute service takes several minutes; run it in the background on size "xl".

Usage:
  python3 klm_transcribe.py sermon.mp4 --out transcript [--start 1800 --end 4800] [--model small.en]

--start/--end (seconds) limit the work to the preaching portion of a full
service recording, which is the single biggest time saver.
"""
import argparse
import json
import subprocess
import sys

from faster_whisper import WhisperModel


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default="transcript")
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=0)
    ap.add_argument("--model", default="small.en")
    a = ap.parse_args()

    # 16 kHz mono WAV of just the requested window
    wav = a.out + ".wav"
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if a.start:
        cmd += ["-ss", str(a.start)]
    if a.end:
        cmd += ["-to", str(a.end)]
    cmd += ["-i", a.video, "-vn", "-ac", "1", "-ar", "16000", wav]
    subprocess.run(cmd, check=True)

    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(wav, word_timestamps=True, vad_filter=True, language="en")
    words = []
    with open(a.out + ".log", "a") as log:
        for seg in segments:
            for w in seg.words or []:
                words.append({"w": w.word.strip(), "s": round(w.start + a.start, 2), "e": round(w.end + a.start, 2)})
            log.write(f"{seg.end + a.start:.0f}s / {info.duration + a.start:.0f}s\n")
            log.flush()
            # checkpoint so a killed run still leaves usable output
            json.dump({"duration": info.duration, "offset": a.start, "words": words}, open(a.out + ".json", "w"))
    print(f"{len(words)} words -> {a.out}.json", file=sys.stderr)


if __name__ == "__main__":
    main()
