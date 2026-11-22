#!/usr/bin/env python3
"""
Cut vertical, captioned social clips from a source video.

Input: source video, clips.json (from klm_find_moments.py, or hand-written
       [{"slug","start","end"}]) and optionally transcript.json for captions.
Output: <outdir>/<slug>.mp4 at 1080x1920 (9:16), H.264/AAC, ready for
        Reels / Shorts / TikTok, plus <slug>.jpg cover frame.

Captions: 2-4 words at a time, bold, lower-middle of frame, inside the
platform safe zone (clear of the bottom ~300 px and the right button column).
The clip's first words are the hook, so nothing covers the first second.

Framing: --focus-x / --focus-y say where the preacher stands in the wide shot
(0 = left/top edge, 1 = right/bottom edge) and --zoom punches in on that
point. A 16:9 source is cropped to a 9:16 window around it. The KLM livestream
is a fixed wide shot with the preacher small and low in frame, so the working
default there is --zoom 1.5 --focus-x 0.52 --focus-y 0.75. Use --mode blur to keep the whole wide shot
over a blurred background instead (safer when the preacher walks a lot).

Clips flagged "review": true are skipped unless --include-review is given.

Usage:
  python3 klm_cut_clips.py sermon.mp4 clips.json --transcript transcript.json --outdir clips
"""
import argparse
import json
import os
import subprocess

FONT = "Montserrat"  # preinstalled in the Higgsfield sandbox; falls back to the system sans


def ass_time(t):
    h, rem = divmod(max(0, t), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def write_ass(words, start, end, path, per_line=3):
    """Group spoken words into short caption cards timed to the audio."""
    seg = [w for w in words if start <= w["s"] and w["e"] <= end + 0.3]
    lines, cur = [], []
    for w in seg:
        cur.append(w)
        gap_next = False
        if len(cur) >= per_line or w["w"].rstrip().endswith((".", "?", "!", ",", ";", ":")) and len(cur) >= 2:
            gap_next = True
        if gap_next:
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    head = (
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
        f"Style: Cap,{FONT},84,&H00F2EFE9,&H00101010,&H80000000,-1,1,6,2,2,90,150,520\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n"
    )
    with open(path, "w") as f:
        f.write(head)
        for i, ln in enumerate(lines):
            s = ln[0]["s"] - start
            e = (lines[i + 1][0]["s"] - start) if i + 1 < len(lines) else ln[-1]["e"] - start + 0.3
            e = min(e, ln[-1]["e"] - start + 1.2)  # do not hang on screen through a long pause
            text = " ".join(w["w"] for w in ln).upper()
            f.write(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,{text}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("clips")
    ap.add_argument("--transcript")
    ap.add_argument("--outdir", default="clips")
    ap.add_argument("--mode", choices=["crop", "blur"], default="crop")
    ap.add_argument("--focus-x", type=float, default=0.5)
    ap.add_argument("--focus-y", type=float, default=0.5, help="vertical centre of the punch-in (0 top, 1 bottom)")
    ap.add_argument("--zoom", type=float, default=1.0,
                    help="punch-in factor; 1.5 keeps 1/1.5 of the frame height. Use for a far-away wide shot.")
    ap.add_argument("--include-review", action="store_true")
    a = ap.parse_args()

    os.makedirs(a.outdir, exist_ok=True)
    words = json.load(open(a.transcript))["words"] if a.transcript else None

    for c in json.load(open(a.clips)):
        if c.get("start") is None or c.get("end") is None:
            print("SKIP (no timecodes):", c["slug"])
            continue
        if c.get("review") and not a.include_review:
            print("SKIP (needs review):", c["slug"])
            continue
        dur = c["end"] - c["start"]
        out = os.path.join(a.outdir, c["slug"] + ".mp4")

        if a.mode == "crop":
            # 9:16 column of the source, centred on focus-x and clamped to the frame
            # 9:16 window, 1/zoom of the frame height, centred on the focus point and clamped to the frame
            z = max(1.0, a.zoom)
            vf = (f"crop=ih/{z}*9/16:ih/{z}:"
                  f"max(0\\,min(iw-ih/{z}*9/16\\,iw*{a.focus_x}-ih/{z}*9/32)):"
                  f"max(0\\,min(ih-ih/{z}\\,ih*{a.focus_y}-ih/{z}/2)),"
                  "scale=1080:1920:flags=lanczos")
        else:
            vf = ("split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                  "boxblur=24:2,eq=brightness=-0.25[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2")
        if words:
            ass = os.path.join(a.outdir, c["slug"] + ".ass")
            write_ass(words, c["start"], c["end"], ass)
            vf += f",ass={ass}"

        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-ss", str(c["start"]), "-i", a.video, "-t", f"{dur:.2f}",
            "-vf", vf, "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-movflags", "+faststart", out,
        ], check=True)
        # cover frame from one second in
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", out, "-frames:v", "1",
                        out.replace(".mp4", ".jpg")], check=True)
        print(f"OK {out} ({dur:.0f}s)")


if __name__ == "__main__":
    main()
