#!/usr/bin/env python3
"""
Kingdom Life Ministries - Subsplash message finder / downloader.

Lists the newest messages in the church's public Subsplash media library and
(optionally) downloads the MP4 for one of them. Uses only the public web
client's guest token, so no credentials are needed.

Standard library only, so it runs unchanged inside the Higgsfield sandbox
(which has internet access; the Claude cloud container usually does not).

Usage:
  python3 klm_subsplash.py list                 # newest 8 messages as JSON
  python3 klm_subsplash.py list --date 2026-11-22
  python3 klm_subsplash.py download --date 2026-11-22 --out sermon.mp4
  python3 klm_subsplash.py download --latest --out sermon.mp4

Exit code 3 = no message found for that date yet (recording not posted).
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request

APP_KEY = "G7XJZ4"                              # Kingdom Life Ministries app key
TOKEN_PAGE = "https://subsplash.com/+27qk/media"  # server-rendered page that carries the guest token
CORE = "https://core.subsplash.com"
UA = "Mozilla/5.0 (compatible; sermon-content-pipeline)"


def _http(url, token=None, timeout=30):
    headers = {"User-Agent": UA, "Accept": "application/json, text/html"}
    if token:
        headers["Authorization"] = "Bearer " + token
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout)


def guest_token():
    """Pull the short-lived guest API token out of the public media page."""
    page = _http(TOKEN_PAGE).read().decode("utf-8", "replace")
    m = re.search(r'id="shoebox-tokens">(.*?)</script>', page, re.S)
    if not m:
        sys.exit("Could not find the Subsplash guest token (page layout changed?)")
    return json.loads(m.group(1))["apiToken"]


def list_messages(token, size=8):
    q = urllib.parse.urlencode({
        "filter[app_key]": APP_KEY, "sort": "-date", "page[size]": size, "include": "video",
    })
    data = json.load(_http(f"{CORE}/media/v1/media-items?{q}", token))
    out = []
    for it in data.get("_embedded", {}).get("media-items", []):
        video = (it.get("_embedded") or {}).get("video") or {}
        out.append({
            "date": (it.get("date") or "")[:10],
            "title": it.get("title"),
            "short_code": it.get("short_code"),
            "share_url": (it.get("_links", {}).get("share") or {}).get("href"),
            "video_id": video.get("id"),
            "duration_min": round((video.get("duration") or 0) / 60000, 1),
        })
    return out


def mp4_url(token, video_id):
    """Resolve the progressive MP4 (not the HLS playlist) for a video."""
    data = json.load(_http(f"{CORE}/files/v1/videos/{video_id}", token))
    outputs = (data.get("_embedded") or {}).get("video-outputs") or []
    if not outputs:
        return None  # still transcoding
    best = max(outputs, key=lambda o: o.get("height") or 0)
    return best["_links"]["related"]["href"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["list", "download"])
    ap.add_argument("--date", help="YYYY-MM-DD message date")
    ap.add_argument("--latest", action="store_true")
    ap.add_argument("--out", default="sermon.mp4")
    a = ap.parse_args()

    token = guest_token()
    msgs = list_messages(token)
    if a.date:
        msgs = [m for m in msgs if m["date"] == a.date]
    if a.cmd == "list":
        print(json.dumps(msgs, indent=2))
        sys.exit(0 if msgs else 3)

    if not msgs or not msgs[0]["video_id"]:
        print("No message with video found for that date yet.", file=sys.stderr)
        sys.exit(3)
    pick = msgs[0]
    url = mp4_url(token, pick["video_id"])
    if not url:
        print("Video exists but the MP4 is still processing.", file=sys.stderr)
        sys.exit(3)
    with _http(url, timeout=120) as r, open(a.out, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    print(json.dumps({**pick, "mp4": url, "saved_to": a.out}, indent=2))


if __name__ == "__main__":
    main()
