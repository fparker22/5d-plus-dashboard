#!/bin/bash
# KLM event promo finishing pass: title hook, lower third, event-info strip,
# logo bar, progress bar and music bed. Runs in the Higgsfield sandbox after the reel-effects
# render (text-behind + captions). See directives/klm_event_promo_clip.md.
#
# usage:
#   S1=18.2 \
#   TITLE="FEED JACKSON IS BACK" TITLE_SUB="THANKSGIVING DAY  |  FREE MEAL" \
#   INFO1="THANKSGIVING DAY  •  11 AM - 1 PM  •  FREE" INFO2="1107 ADRIAN ST  •  (855) 773-3190" \
#   BEDFILE=bed_rnb.mp3 \
#   klm_promo_finish.sh in.mp4 out.mp4
#
#   S1            second at which the event-info strip appears (start of the first cutaway).
#                 Flyer cutaways are done earlier by klm_promo_broll.sh, under the captions.
#   BED           music gain, default 0.55 (bed about 12-14 dB under the voice)
#
# Text passed to drawtext must not contain apostrophes or colons.
# Needs /home/user/klm/brand/klm_crest.png (gold crest, transparent PNG).
set -e
IN="$1"; OUT="$2"
: "${S1:?}" "${TITLE:?}" "${TITLE_SUB:?}" "${INFO1:?}" "${INFO2:?}"
BEDFILE="${BEDFILE:-bed.mp3}"
NAME="${NAME:-PASTOR FRED PARKER}"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
F=/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf
G=0xF5B81F
FADE=$(python3 -c "print(max(0,$D-2.0))")
FADEV=$(python3 -c "print(max(0,$D-0.3))")
ffmpeg -y -loglevel error -i "$IN" -i /home/user/klm/brand/klm_crest.png -stream_loop -1 -i "$BEDFILE" \
 -f lavfi -i "color=c=$G:s=1080x14:r=30" -filter_complex "
 [1:v]scale=-2:104[crest];
 [0:v]drawbox=x=0:y=0:w=iw:h=200:color=black@0.45:t=fill,
 drawtext=fontfile=$F:text='KINGDOM LIFE MINISTRIES':fontcolor=white:fontsize=38:x=176:y=62,
 drawtext=fontfile=$F:text='YOU’LL LEAVE BETTER':fontcolor=$G:fontsize=26:x=178:y=114,
 drawbox=x=90:y=300:w=900:h=230:color=$G@0.96:t=fill:enable='lt(t,3.2)',
 drawtext=fontfile=$F:text='$TITLE':fontcolor=black:fontsize=${TITLE_SIZE:-64}:x=(w-text_w)/2:y=345:enable='lt(t,3.2)',
 drawtext=fontfile=$F:text='$TITLE_SUB':fontcolor=black:fontsize=34:x=(w-text_w)/2:y=452:enable='lt(t,3.2)',
 drawbox=x=60:y=1500:w=14:h=130:color=$G:t=fill:enable='between(t,3.6,9.0)',
 drawbox=x=74:y=1500:w=640:h=130:color=black@0.72:t=fill:enable='between(t,3.6,9.0)',
 drawtext=fontfile=$F:text='$NAME':fontcolor=white:fontsize=44:x=100:y=1520:enable='between(t,3.6,9.0)',
 drawtext=fontfile=$F:text='KINGDOM LIFE MINISTRIES':fontcolor=$G:fontsize=28:x=102:y=1580:enable='between(t,3.6,9.0)',
 drawbox=x=0:y=1490:w=iw:h=170:color=black@0.78:t=fill:enable='gte(t,${S1})',
 drawbox=x=0:y=1490:w=iw:h=8:color=$G:t=fill:enable='gte(t,${S1})',
 drawtext=fontfile=$F:text='$INFO1':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=1520:enable='gte(t,${S1})',
 drawtext=fontfile=$F:text='$INFO2':fontcolor=$G:fontsize=44:x=(w-text_w)/2:y=1582:enable='gte(t,${S1})',
 drawbox=x=0:y=1906:w=iw:h=14:color=black@0.5:t=fill[v0];
 [v0][crest]overlay=44:48[v1];
 [v1][3:v]overlay=x='-1080+1080*t/$D':y=1906:shortest=1,fade=t=out:st=$FADEV:d=0.3[v];
 [0:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,asplit=2[voice][sc];
 [2:a]atrim=0:$D,volume=${BED:-0.55},afade=t=in:d=0.5,afade=t=out:st=$FADE:d=2.0[bed];
 [bed][sc]sidechaincompress=threshold=0.08:ratio=2.5:attack=20:release=350[duck];
 [voice][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
 -map "[v]" -map "[a]" -t "$D" -c:v libx264 -preset veryfast -crf 22 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
