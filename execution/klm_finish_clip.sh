#!/bin/bash
# KLM clip finishing pass: logo bar, message-title hook, progress bar and music bed.
#
# Runs in the Higgsfield sandbox after the reel-effects render.
# usage: klm_finish_clip.sh <in.mp4> <out.mp4> "<MESSAGE TITLE>" "<SMALL LINE>"
#   e.g. klm_finish_clip.sh captions.mp4 final.mp4 "CUT, NOT SIGNED" "COMMIT  |  WEEK 2"
#
# Needs in /home/user/klm/brand:
#   klm_crest.png  gold crest cropped from the KLM logo (transparent PNG)
#   bed.mp3        instrumental music bed at least as long as the clip
#
# Music level: the bed sits about 12 dB under the voice with light ducking.
# The first version (volume 0.30, ratio 6) was inaudible - do not go back to it.
set -e
IN="$1"; OUT="$2"; HOOK="$3"; SUB="$4"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
F=/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf
FADE=$(python3 -c "print(max(0,$D-1.8))")
ffmpeg -y -loglevel error -i "$IN" -i /home/user/klm/brand/klm_crest.png -stream_loop -1 -i /home/user/klm/brand/bed.mp3 \
 -f lavfi -i "color=c=0xF5B81F:s=1080x14:r=30" -filter_complex "
 [1:v]scale=-2:104[crest];
 [0:v]drawbox=x=0:y=0:w=iw:h=200:color=black@0.45:t=fill,
 drawtext=fontfile=$F:text='KINGDOM LIFE MINISTRIES':fontcolor=white:fontsize=38:x=176:y=62,
 drawtext=fontfile=$F:text='YOU’LL LEAVE BETTER':fontcolor=0xF5B81F:fontsize=26:x=178:y=114,
 drawbox=x=90:y=300:w=900:h=230:color=0xF5B81F@0.96:t=fill:enable='lt(t,3.3)',
 drawtext=fontfile=$F:text='$HOOK':fontcolor=black:fontsize=92:x=(w-text_w)/2:y=336:enable='lt(t,3.3)',
 drawtext=fontfile=$F:text='$SUB':fontcolor=black:fontsize=36:x=(w-text_w)/2:y=456:enable='lt(t,3.3)',
 drawbox=x=0:y=1906:w=iw:h=14:color=black@0.5:t=fill[v0];
 [v0][crest]overlay=44:48[v1];
 [v1][3:v]overlay=x='-1080+1080*t/$D':y=1906:shortest=1[v];
 [0:a]loudnorm=I=-14:TP=-1.5:LRA=11,asplit=2[voice][sc];
 [2:a]atrim=0:$D,volume=0.75,afade=t=in:d=0.6,afade=t=out:st=$FADE:d=1.8[bed];
 [bed][sc]sidechaincompress=threshold=0.08:ratio=2:attack=20:release=400[duck];
 [voice][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
 -map "[v]" -map "[a]" -t "$D" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
