---
name: klm-sunday-content
description: Turn a Kingdom Life Ministries Sunday message (or a video Pastor Fred drops in) into captioned vertical clips, a week of social posts and six daily devotional emails. Use when asked to "run Sunday content", "pull the clips", "make clips from today's message", "do the devotionals", or to process a dropped-in phone/camera video.
---

# KLM Sunday Content Engine

The full procedure lives in `directives/klm_sunday_content_engine.md`. Read it first and follow it;
it is the source of truth and is updated as the process is learned.

Quick map:
1. Manuscript + marketing package from Notion (Kingdom Life Ministries / Word / current series).
2. Recording from Subsplash with `execution/klm_subsplash.py`, run inside the Higgsfield sandbox.
3. `klm_transcribe.py` -> `klm_find_moments.py` -> `klm_cut_clips.py`.
4. Higgsfield Virality Predictor on the top candidates; upscale only the lead clip if needed.
5. Metricool drafts, Notion Email Send Log drafts, one Notion page for the week.

Non-negotiables: nothing is posted or emailed without Pastor Fred's approval; captions quote what
was actually said; the manuscript's guardrails apply to every asset; stay under the Higgsfield
credit ceiling in the directive and report the spend.

Arguments: an optional date (`YYYY-MM-DD`, default the most recent Sunday) or `inbox` to process
drop-in videos from Dropbox `/KLM Content Engine/Inbox`.
