#!/bin/bash
# Full-screen flyer cutaways for a KLM event promo, composited UNDER the caption layer.
#
# Each flyer takes over the whole 1080x1920 frame: a blurred, slightly darkened copy of the flyer
# fills the screen and the flyer itself sits large on top. It dissolves in over 0.45 s while
# settling from 110% to 100% size, drifts in slowly, then dissolves back to the speaker.
#
# Run it on the text-behind render BEFORE stacking captions, so captions stay readable on top:
#   cp $W1/out/text-behind.mp4 $W1/out/text-behind.orig.mp4
#   S1=18.2 E1=25.6 S2=45.5 E2=52.9 FLYER1=square.jpg FLYER2=portrait.jpg \
#     klm_promo_broll.sh $W1/out/text-behind.orig.mp4 tb_broll.mp4
#   cp tb_broll.mp4 $W1/out/text-behind.mp4      # then: effects.py stack / build captions / render
#
# FLYER1 must be square (1:1), FLYER2 portrait (4:5). Takes ~90 s for a 60 s clip: run it as a
# background command.
set -e
IN="$1"; OUT="$2"; X=0.45
: "${S1:?}" "${E1:?}" "${S2:?}" "${E2:?}"
L1=$(python3 -c "print(round($E1-$S1+$X,2))"); L2=$(python3 -c "print(round($E2-$S2+$X,2))")
N1=$(python3 -c "print(int(($E1-$S1+$X)*30))"); N2=$(python3 -c "print(int(($E2-$S2+$X)*30))")
O1=$(python3 -c "print($E1-$S1)"); O2=$(python3 -c "print($E2-$S2)")
ffmpeg -y -loglevel error -i "$IN" -loop 1 -framerate 30 -t $L1 -i "${FLYER1:-flyer_seat.jpg}" -loop 1 -framerate 30 -t $L2 -i "${FLYER2:-flyer_table.jpg}" -filter_complex "
 [1:v]split[a1][b1];[2:v]split[a2][b2];
 [a1]scale=-2:1920,crop=1080:1920,boxblur=28:3,eq=brightness=-0.06:saturation=1.15[bg1];
 [b1]scale=2160:2160,zoompan=z='if(lt(on,14),1.10-0.10*on/14,1+0.035*(on-14)/($N1-14))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1080:fps=30[fg1];
 [bg1][fg1]overlay=0:215:shortest=1,format=rgba,fade=t=in:st=0:d=$X:alpha=1,fade=t=out:st=$O1:d=$X:alpha=1,setpts=PTS+$S1/TB[fs1];
 [a2]scale=-2:1920,crop=1080:1920,boxblur=28:3,eq=brightness=-0.06:saturation=1.15[bg2];
 [b2]scale=1704:2130,zoompan=z='if(lt(on,14),1.10-0.10*on/14,1+0.035*(on-14)/($N2-14))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=852x1065:fps=30,pad=864:1077:6:6:color=0xF5B81F[fg2];
 [bg2][fg2]overlay=108:210:shortest=1,format=rgba,fade=t=in:st=0:d=$X:alpha=1,fade=t=out:st=$O2:d=$X:alpha=1,setpts=PTS+$S2/TB[fs2];
 [0:v][fs1]overlay=0:0:eof_action=pass:enable='between(t,$S1,$E1+$X)'[m1];
 [m1][fs2]overlay=0:0:eof_action=pass:enable='between(t,$S2,$E2+$X)'[v]" \
 -map "[v]" -map 0:a -c:v libx264 -preset veryfast -crf 16 -pix_fmt yuv420p -c:a copy "$OUT"
