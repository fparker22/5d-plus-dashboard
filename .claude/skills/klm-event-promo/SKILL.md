---
name: klm-event-promo
description: Turn a short phone video from Pastor Fred (an event invitation, announcement or reminder) into a finished branded social promo for Kingdom Life Ministries - title hook, lower third, animated captions, punch words behind him, flyer cutaways, event-info strip with the 855 number, logo and music. Use when asked to "make a promo", "turn this clip into a promo", "promo for Feed Jackson" or any event video he drops in Dropbox.
---

# KLM Event Promo Clip

The full procedure is in `directives/klm_event_promo_clip.md`. Read it first and follow it.

Quick map:
1. Get the original file from Dropbox (a YouTube link cannot be downloaded).
2. Logo from the Notion "Kingdom Life Ministries" page cover; flyers from the event's Metricool posts.
3. In the Higgsfield sandbox: base clip (60 s max) -> `remove_background` matte ->
   `reel-effects` text-behind punch words + spotlight captions -> `execution/klm_promo_finish.sh`.
4. Show Pastor Fred the clip, the date it must post, and the credits spent.

Non-negotiables: nothing is posted without his approval; every fact on screen comes from the flyer
or his own words; check timing words like "tomorrow" before choosing a post date.

Arguments: the Dropbox folder or file name, and the event name.
