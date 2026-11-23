# Directive: KLM Sunday Content Engine

Turn each Sunday message at Kingdom Life Ministries (and any video Pastor Fred drops in) into
short clips, social posts and a week of daily devotional emails.

## Goal
Every week, from one message:
1. **5-8 vertical clips** (9:16, burned-in captions) of the moments most likely to travel.
2. **Posts scheduled** across the week in Metricool (Facebook, Instagram, YouTube).
3. **Six daily devotional emails** (Mon-Sat) built on the message's practical application.
4. One Notion page that holds all of it, so Pastor Fred can review in one place.

## Standing rules (do not skip)
- **Nothing goes public without Pastor Fred's OK.** Clips are shown to him, posts are created in
  Metricool as **drafts** (`draft: true`), emails are logged as **Draft** in the Notion Email Send Log.
  Only schedule/send after he approves in chat. A general "do this every week" is not approval of a
  specific post.
- **Quote the pulpit, not the page.** Captions and quote text come from what was actually said
  (the transcript). The manuscript only tells you where to look.
- **Honor the manuscript's guardrails.** Every manuscript and marketing package ends with a
  guardrails / standing-corrections list (claims not to make, dates to correct, statistics not to
  invent). Read it first; it applies to every caption, post and email.
- **A clip must stand alone without misrepresenting the sermon.** If a line only works with the
  setup, include the setup or drop the clip.
- **Higgsfield credit ceiling: 150 credits per weekly run** unless Pastor Fred raises it. Cutting,
  captioning and transcription in the Higgsfield sandbox cost no generation credits; the Virality
  Predictor, reframe, upscales and any generated video/image do. Check `balance` before and after
  and report the spend.
- Scripture is KJV unless the manuscript says otherwise. Never paraphrase a verse inside quote marks.

## Inputs
| Input | Where |
| --- | --- |
| Manuscript + marketing package | Notion: Kingdom Life Ministries / Word / (current series) / `WEEK N - ...` pages |
| Sunday recording | Subsplash app key `G7XJZ4`. Auto-published as "Sunday Live Worship..." or the message title, usually within ~1 hour of the 9:55 AM stream ending. Whole service (~55-90 min), 1280x720, fixed wide shot. |
| Drop-in videos (phone/camera) | Dropbox folder `/KLM Content Engine/Inbox` (see "Drop-in videos") |
| Brand, time zone, accounts | Metricool brand `5550538` "Kingdom Life Ministries", America/Detroit. Facebook, Instagram (@kingdomlifeministries), YouTube connected. No TikTok or X connected. |
| Email list + log | Notion: Kingdom Life Ministries / KLM Email Groups (sends go out through SendGrid from info@kingdom-life-ministries.org) |

## Tools / Scripts
All four are standard-library or sandbox-preinstalled, and are meant to run **inside the Higgsfield
sandbox** (`sandbox_exec`), because the Claude cloud container cannot reach Subsplash or Higgsfield
storage. Working folder in the sandbox: `/home/user/klm` (kept ~24 h after last use).

| Script | Job |
| --- | --- |
| `execution/klm_subsplash.py` | `list` newest messages; `download --date YYYY-MM-DD --out sermon.mp4`. Exit code 3 = not posted yet. |
| `execution/klm_transcribe.py` | Word-level transcript (`--start/--end` seconds to cover only the preaching). |
| `execution/klm_find_moments.py` | Matches manuscript quotes to the transcript, writes `clips.json` with real timecodes. Low-confidence matches are flagged `review` instead of guessed. |
| `execution/klm_cut_clips.py` | Cuts 1080x1920 captioned clips + cover frames. |

Getting the scripts into the sandbox: write each file there with a plain-text heredoc
(`cat > file <<'EOF'`). Base64 or other byte-relay is refused by the sandbox, and the Claude container
cannot PUT to `upload.higgsfield.ai`.

## Workflow

### 1. Before Sunday is over: build the clip plan from the manuscript
Read the week's manuscript and marketing package. Pick 8-10 candidate moments and write
`moments.json` (`slug`, `start_quote`, `end_quote`). Use short, distinctive quotes of 6-12 words that
he is likely to say close to verbatim. Good sources, in order:
1. The marketing package's "TikTok / Reels concepts" and quote cards.
2. `RUN MOMENT` callouts and the peak.
3. The opening hook (relatable humor travels furthest).
4. Counter-intuitive Bible insights ("read the third name again").
5. The close.

Moment types that travel: contrast statements, scripture reveals, story turns, quotable definitions,
challenges, relatable humor. Shape each clip as **Hook -> Turn -> Land**.

### 2. Get the recording
```
python3 klm_subsplash.py download --date YYYY-MM-DD --out sermon.mp4
```
Exit code 3 means it is not posted yet: check again in 30-60 minutes; do not substitute an older week.
Grab three still frames to find where the preaching starts and where he stands.

### 3. Transcribe only the preaching
Run in the background (`background: true`, 15-minute limit per command). Roughly 1 minute of
compute per 4 minutes of audio on the standard sandbox, so split a 45-minute sermon into two or three
`--start/--end` windows, or use `size: "xl"`.

### 4. Find the moments, then review them
```
python3 klm_find_moments.py transcript.json moments.json --out clips.json
```
Read the `spoken` text of every clip. Fix `review` items by hand (search the transcript for what he
actually said) or drop them. Also skim the transcript for unscripted moments: the best line of the
morning is often one that was never in the manuscript.

### 5. Choose the clips (Pastor Fred picks the lead)
The lead clip is **the heart of the message**, not the funniest opener. Offer him the top three
candidates with their spoken text and a one-line reason each, and let him choose. Do not default to
the introduction or a laugh line.

Every clip is **one continuous 20-45 second moment**. Do not stitch separate parts of the sermon
together: jump cuts read as choppy. If a thought needs more than 45 seconds, find the tighter
version of it or pick another moment. (One longer story clip a week is still allowed as a test.)

### 6. Produce each clip (the KLM look)
This is the approved pipeline from the Nov 22, 2026 tests. Per 35-second clip it costs about
10 Higgsfield credits (Topaz upscale 9, background cut-out 1); the music bed is ~7 credits once
and is reused.

1. **Cut one continuous crop**, no captions, at half size for the upscaler:
   `ffmpeg -ss START -i sermon.mp4 -t LEN -vf "crop=270:480:530:240,scale=540:960:flags=lanczos" -r 30 -c:v libx264 -preset slow -crf 14 -c:a aac raw.mp4`
   (`crop=270:480:530:240` frames the preacher on the current MLK Center livestream; check a frame.)
2. **Upscale** with `upscale_video` (`provider: topaz`, `resolution: 1080p`, `aspect_ratio: 9:16`).
   The Subsplash file is only ~330 kbps at 720p, which is why un-upscaled clips look soft. YouTube
   blocks downloads from the sandbox, so Subsplash + Topaz is the best available source.
3. **Background cut-out** with `remove_background` on the same raw clip (`media_type: video`).
4. **Higgsfield reel-effects** (load the `reel-effects` workflow; scripts are preinstalled):
   `prepare` with the upscaled clip and `--matte`, `transcribe`, then **fix the transcript**
   (merge split hyphen words such as "e -pens", check KJV names) before building.
   - Layer 1 `text-behind`, `style: bold`, `color: #F5B81F`: 3-5 single punch words taken from
     what he says (BLOOD, OATH, DEATH), cued on the spoken word. Render with `--no-finish`.
     Keep the first 3.3 seconds free for the title hook.
   - Layer 2 `captions` (`stack` on layer 1): `look: spotlight`, `color: #F5B81F`, `style: bold`,
     `y: 1330`, `max_words: 3`.
   - Check `--stills` (times need an `s` suffix, e.g. `5.0s,11.4s`) before every full render.
   - Do not use `katana-cool-dude` here: its white serif words vanish against the white banner.
5. **Finish** with `execution/klm_finish_clip.sh in.mp4 out.mp4 "MESSAGE TITLE" "SERIES  |  WEEK N"`:
   gold crest + "Kingdom Life Ministries / You'll Leave Better" bar, a 3-second message-title hook,
   a gold progress bar, and the music bed.
6. **Music**: warm gospel-soul instrumental from `elevenlabs_music_v2_5` (`force_instrumental`),
   matched to the tone of the moment, about 12 dB under his voice. It must be clearly audible on
   a phone speaker without competing with him.
7. **Brand assets** live in the sandbox at `/home/user/klm/brand`. The logo comes from the cover
   image of the Notion "Kingdom Life Ministries" page (the signed URL lasts 5 minutes: fetch the
   page, then `curl` it in the sandbox straight away) and the crest is the left part of it.
8. Upload (`media_upload` first, `curl PUT` in the producing command, `media_confirm`) and run
   `virality_predictor` on the candidates; use its hook and retention notes to re-trim.

Other Higgsfield looks worth testing on future clips: `katana-bold` (punch words, needs the matte),
`freeze-frame` (name/key phrase tag), `grade-wipe`. One look per clip. The generative "Viral"
presets redraw footage with AI and are not for clips of a real sermon unless Pastor Fred asks.

### 7. Write the posts
One caption per clip, in Pastor Fred's voice, drawn from the marketing package where it exists.
First line is the hook; end with one clear next step. Always carry the week's live call to action
and any date corrections from the guardrails.

Default week (America/Detroit), adjusted around anything already scheduled in Metricool:
| When | What |
| --- | --- |
| Sun ~6-7 PM | Lead clip (Reel + Facebook Reel + YouTube Short) |
| Mon | Quote card or discussion question |
| Tue | Clip 2 |
| Wed | Clip 3 (pairs with Wednesday Word) |
| Thu | Clip 4 |
| Fri | The longer story clip |
| Sat | Clip that points to tomorrow |

Call `getScheduledPosts` first so nothing collides with existing posts, and `getBestTimeToPostByNetwork`
for the hour. Create as drafts until approved.

### 8. Daily devotional emails (Mon-Sat)
Source: the manuscript's **Practical Application** list - one point per day - plus the message's
scriptures. Each email:
- **Subject** 6-10 words / under 50 characters. **Preheader** is a verse or a question, not a repeat.
- **Scripture** (one verse, KJV) -> **Thought** (120-200 words, his lines, his voice) ->
  **Today's one step** (one concrete action) -> **Prayer** (2-3 sentences).
- A link to the message and that day's clip once they exist.
- Friday/Saturday recap the week and point to Sunday.
- Send time: 6:30 AM America/Detroit.

Log each one as a row in the Notion **Email Send Log** with Status = **Draft**, Topic = Sermon,
Group = KLM Member Distribution, the full copy in the page body. After approval they are sent as
SendGrid Single Sends and the row is moved to Sent with the recipient count.

### 9. Publish the week's page in Notion
Create `WEEK N - Content Engine (title)` beside the manuscript: clip table (slug, timecodes, length,
virality notes, link), captions, posting schedule, the six devotionals, credits spent, and anything
that needs Pastor Fred's decision at the top.

## Drop-in videos
Pastor Fred records on his phone or a camera and drops the file into Dropbox
`/KLM Content Engine/Inbox`. For each new file:
1. `download_link` (single-use URL; do not preview it) -> `curl` it inside the Higgsfield sandbox.
2. Transcribe the whole thing, pick moments from the transcript itself (there is no manuscript).
3. Cut with `klm_cut_clips.py`. A vertical phone video needs no zoom (`--zoom 1`); a horizontal one
   uses `--focus-x` on the speaker or `--mode blur`.
4. Same review, caption, draft and approval steps as above.
5. Move the source to `/KLM Content Engine/Processed` only after he confirms the clips are right.

A phone on a tripod at the front, recording vertically, gives far sharper sermon clips than the
720p livestream wide shot. If one exists for a Sunday, use it instead of the Subsplash file.

## Edge cases and learnings
- **Subsplash titles are unreliable.** Recent weeks are auto-titled "Sunday Live Worship-Kingdom Life
  Ministries-Online Campus"; match on `date`, not title. The public title may also differ from the
  manuscript title (Week 7 was promoted as "Out the Group Chat").
- **Not every Sunday is published** (Nov 15, 2026 was not in the library on Nov 22). If the date is
  missing after 3 PM, ask Pastor Fred; the YouTube/Facebook live archive is the fallback.
- **The guest token is scraped from the public media page.** If `klm_subsplash.py` reports it cannot
  find the token, Subsplash changed their page; inspect `https://subsplash.com/+27qk/media`.
- **Network:** the Claude cloud container is blocked from subsplash.com and upload.higgsfield.ai
  (proxy 403). Do the media work in the Higgsfield sandbox, which has open internet.
- **Sandbox limits:** foreground commands 120 s, background 15 min, one CPU on standard size.
- **Do not use Whisper's VAD filter.** On the Nov 22, 2026 recording it threw away almost the whole sermon (1 word from 16 minutes). `klm_transcribe.py` now runs with it off.
- **Do not run 4 transcriptions in parallel or rely on the XL sandbox for long jobs**: the Nov 22 run died silently. Run two chunks of ~15 minutes per background command on the standard sandbox and poll with calls under 60 seconds.
- **The camera framing changes week to week** (Nov 22 was much wider than Oct 18). Always grab a frame and set the crop for that day.
- **faster-whisper `small.en`** handled his cadence well in testing; KJV proper nouns
  (Parthians, Shinar, Mesopotamia) should be spot-checked in captions.
- **Research caveat (Nov 2026):** clip-length studies conflict (Socialinsider: 30-60 s best reach;
  Buffer: 90 s-3 min best). That is why the plan tests one long clip a week; let KLM's own Metricool
  numbers settle it after a month.

## Success criteria
- Lead clip drafted in Metricool by 6 PM Sunday; the rest of the week drafted by Monday morning.
- Six devotionals in the Email Send Log as Draft by Sunday night.
- Zero posts or emails published without approval; zero captions that break a manuscript guardrail.
- Credits spent reported, and under the ceiling.
