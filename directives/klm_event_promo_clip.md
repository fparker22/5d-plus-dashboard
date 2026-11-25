# Directive: KLM Event Promo Clip

Turn a short video Pastor Fred records on his phone (an invitation, an announcement, an event
reminder) into a finished, branded social promo.

First built for Feed Jackson, Thanksgiving 2026 (Nov 25, 2026).

## Goal
One vertical video, 60 seconds or less, ready for Facebook, Instagram Reels and YouTube Shorts:
his message untouched, plus title hook, lower third, animated captions, punch words behind him,
flyer cutaways, an event-info strip, logo bar, progress bar and a music bed.

## Standing rules
- **Show him the finished clip before anything is posted.** Post or schedule only after he says so.
- **Every fact on screen comes from the flyer or his own words** (date, time, address, phone, price).
  If the video and the flyer disagree, stop and ask.
- **Check the timing words in the video** ("tomorrow", "this Sunday"). They decide which day the
  clip can be posted. Tell him the date it has to go out.
- Never alter what he says. Trimming dead air at the start or end is fine.
- Higgsfield spend for one promo is about 8 credits (music 7, background cut-out 1). Report it.

## Inputs
| Input | Where |
| --- | --- |
| The original video file | Dropbox. He drops it in a folder and names it (e.g. `/Feed Jackson Promo`). **A YouTube link is not enough**: YouTube blocks downloads from the Higgsfield sandbox, and `video_analysis_create` can read a YouTube link but does not return the file. |
| Logo | Cover image of the Notion "Kingdom Life Ministries" page (signed URL lasts 5 minutes: fetch the page, then `curl` it in the sandbox immediately). Crest = left part of the logo. |
| Event flyers | Media URLs on the event's scheduled posts in Metricool (`getScheduledPosts`, brand `5550538`), or the event's Notion page. |
| Event facts | The flyer. Church phone line: (855) 773-3190. |

## Tools
All media work runs in the Higgsfield sandbox (`sandbox_exec`), working folder `/home/user/fj`
(or a new folder per event). The sandbox is wiped after about 24 idle hours, so re-fetch the logo
and flyers each time.

- `execution/klm_promo_finish.sh` - the graphics and music pass (title, lower third, flyer
  cutaways, info strip, logo, progress bar, music mix).
- Higgsfield `reel-effects` workflow - `text-behind` punch words and `captions`.
- Higgsfield `remove_background` (video) - the cut-out that lets words sit behind him.
- Higgsfield `generate_audio`, model `elevenlabs_music_v2_5`, `force_instrumental: true` - music.

## Workflow
1. **Get the file.** Dropbox `search` (with `include_folders`) -> `list_folder` -> `download_link`
   (single use, do not preview it) -> `curl` in the sandbox.
2. **Look at it.** `ffprobe` (phone video is usually HEVC with a rotation flag; ffmpeg rotates it
   automatically) and three still frames. Note where he stands.
3. **Base clip.** 1080x1920, 30 fps, H.264, voice normalized to -14 LUFS. If he is small in frame,
   punch in so his head lands about a quarter of the way down:
   `crop=864:1536:108:250,scale=1080:1920` worked for a full-body shot. Leave room above his head.
4. **Keep it to 60 seconds.** `reel-effects` only processes the first 60 s. Trim dead air at the
   start (and the matte by the same amount) so the clip ends on a complete sentence.
5. **Cut-out.** Upload a small copy (540x960; uploads over ~50 MB are rejected with HTTP 400) and
   run `remove_background`. The matte lines up with the full-size clip.
6. **Transcript.** `effects.py prepare` + `transcribe`, then fix it by hand: names ("Feed
   Jackson"), split words ("home-cooked"), stray "o'clock" tokens. Captions are only as good as this.
7. **Punch words** (`text-behind`, `style: bold`, `color: #F5B81F`, `font_px` about 210): one word
   per key beat, exactly as he says it, timed with `start` seconds. Keep them clear of the first
   3 seconds (title hook) and of the flyer cutaways. Check `--stills` (times need an `s` suffix).
8. **Captions** (`stack` on the punch-word layer): `look: spotlight`, `color: #F5B81F`,
   `style: bold`, `y: 1330`, `max_words: 3`.
9. **Finish** with `klm_promo_finish.sh` (set the cutaway times first):
   - 0-3 s: gold title hook (event name + one-line promise).
   - ~3.5-9 s: lower third, "PASTOR FRED PARKER / KINGDOM LIFE MINISTRIES".
   - Flyer cutaways as bordered cards that slide in while he keeps talking: put the first where
     he says the date, time and address, the second where he says how to RSVP or call.
   - From the first cutaway to the end: info strip with day, time, "FREE", address and phone.
   - Logo bar on top, gold progress bar on the bottom.
   - Music: upbeat instrumental that fits the event (R&B for Feed Jackson), about 12-14 dB under
     his voice, ducked while he speaks.
10. **Check** four or more frames (title, lower third, a cutaway, the ending) and the audio levels,
    upload (`media_upload` first, `curl PUT` in the producing command, `media_confirm`), and give him
    the link with: what is in it, the date it must post, credits spent.
11. **After approval**, schedule in Metricool to Facebook Reel, Instagram Reel and YouTube Short
    with a caption that repeats the event facts and the phone number.

## Edge cases and learnings
- Phone footage is sharp: do not upscale it. Upscaling is only for the Subsplash livestream.
- If the Higgsfield upload widget does not appear for him, Dropbox is the dependable route.
- Final file must stay under ~50 MB to upload: `-crf 22 -maxrate 5M`.
- `drawtext` text must avoid apostrophes and colons; write "11 AM - 1 PM".
- White-on-white: big punch words read best over sky or a plain wall; over a busy background keep
  them gold with the dark outline the effect adds.
