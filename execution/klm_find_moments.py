#!/usr/bin/env python3
"""
Locate planned clip moments inside the real recording.

Input 1: transcript.json from klm_transcribe.py (word-level timestamps).
Input 2: moments.json - the clip plan built from the manuscript:
  [{"slug": "group-chat", "start_quote": "Somebody in this room is in a family group chat",
    "end_quote": "the most effective strategy the devil has ever run", "pad_before": 0.4, "pad_after": 1.2}, ...]

For each moment it fuzzy-matches the start and end quotes against the spoken
words (the preacher never says the manuscript word for word) and writes
clips.json with real timecodes plus a match score. Anything under --min-score
is flagged "review": true instead of being silently guessed.

Standard library only.

Usage:
  python3 klm_find_moments.py transcript.json moments.json --out clips.json
"""
import argparse
import difflib
import json
import re


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower().replace("-", " ")).split()


def best_match(words, tokens, quote, after=0.0):
    """Slide a window the size of the quote over the transcript; return (score, first_idx, last_idx)."""
    q = norm(quote)
    n = len(q)
    if not n:
        return 0, None, None
    qs = " ".join(q)
    anchor = set(q)
    best = (0.0, None, None)
    for i in range(len(tokens) - max(2, n // 2)):
        if words[i]["s"] < after:
            continue
        # cheap pre-filter: the window must share a few words with the quote
        win = tokens[i:i + n + 2]
        if len(anchor.intersection(win)) < max(2, n // 3):
            continue
        for size in (n - 1, n, n + 2):
            cand = tokens[i:i + size]
            if not cand:
                continue
            score = difflib.SequenceMatcher(None, qs, " ".join(cand)).ratio()
            if score > best[0]:
                best = (score, i, i + len(cand) - 1)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("moments")
    ap.add_argument("--out", default="clips.json")
    ap.add_argument("--min-score", type=float, default=0.72)
    ap.add_argument("--max-len", type=float, default=150, help="longest allowed clip in seconds")
    a = ap.parse_args()

    words = json.load(open(a.transcript))["words"]
    tokens = [(norm(w["w"]) or [""])[0] for w in words]
    clips = []
    for m in json.load(open(a.moments)):
        s_score, s_i, _ = best_match(words, tokens, m["start_quote"])
        start = words[s_i]["s"] if s_i is not None else None
        e_score, _, e_j = best_match(words, tokens, m["end_quote"], after=start or 0)
        end = words[e_j]["e"] if e_j is not None else None
        ok = (start is not None and end is not None and s_score >= a.min_score
              and e_score >= a.min_score and 3 < end - start <= a.max_len)
        clip = {
            "slug": m["slug"],
            "start": round(max(0, start - m.get("pad_before", 0.4)), 2) if start is not None else None,
            "end": round(end + m.get("pad_after", 1.0), 2) if end is not None else None,
            "start_score": round(s_score, 2), "end_score": round(e_score, 2),
            "review": not ok,
        }
        if start is not None and end is not None:
            clip["length"] = round(clip["end"] - clip["start"], 1)
            clip["spoken"] = " ".join(w["w"] for w in words if clip["start"] <= w["s"] <= clip["end"])
        clips.append(clip)
        print(f'{"OK " if ok else "REVIEW"} {m["slug"]:<28} {clip.get("start")} -> {clip.get("end")} '
              f'(scores {s_score:.2f}/{e_score:.2f})')
    json.dump(clips, open(a.out, "w"), indent=2)


if __name__ == "__main__":
    main()
