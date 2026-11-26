# Directive: Onboard a Follow-Up Machine Client

## Goal
Take a newly signed client from contract to live on the Follow-Up Machine
(`follow-up-machine/`) in 14 days, with nothing sent to their customers until
they have approved the wording.

## Inputs
- Signed agreement and the plan they bought: `starter`, `growth` or `premium`
- Completed intake form: business name, industry, owner name and email, hours,
  services, prices, policies, address, booking link, review link
- Their existing customer list, if they want it imported
- The phone number to use (new Twilio number, or their number ported or forwarded)

## Tools / Scripts
- `execution/provision_followup_client.py` — creates the business with the full
  starter kit (21 messages, 7 sequences) through the app's agency API
- `follow-up-machine/scripts/sync-voice-agent.ts` — builds the ElevenLabs phone
  attendant from the business's fact sheet (Growth and Premium)
- `follow-up-machine/scripts/smoke.ts` — end-to-end check of the engine

## Steps

### 1. Create the business (day 1)
Always dry-run first:
```bash
python execution/provision_followup_client.py --name "Acme Plumbing" --plan growth --owner "Sam Lee" --owner-email sam@acme.example --dry-run
```
Then run it without `--dry-run`. Note the slug it prints; the lead form is at `/f/<slug>`.

### 2. Write the fact sheet (day 1 to 2)
In the app: Settings → Fact sheet. Include hours, service area, prices,
policies and the address. Only confirmed facts. The agents answer from this and
nothing else, so anything missing becomes "I'll have someone get back to you."

### 3. Start carrier registration (day 1, it takes days)
Register the client's brand and campaign for A2P 10DLC in Twilio. Texts will be
filtered without it.

### 4. Tune the messages (day 3 to 5)
Messages page: read every message aloud with the owner and edit it to sound
like them. Do not add promises (discounts, arrival times) that are not on the
fact sheet.

### 5. Connect the channels (day 3 to 5)
- Twilio number: messaging webhook → `/api/webhooks/twilio/sms?tenant=<slug>`
- Starter: voice webhook → `/api/webhooks/twilio/voice?tenant=<slug>`
- Growth and Premium: run `sync-voice-agent.ts`, attach the agent to the number
  in ElevenLabs, set the post-call webhook → `/api/webhooks/elevenlabs?tenant=<slug>`
- Resend: verify the client's sending domain
- Premium: link their Metricool brand ID in Settings

### 6. Test every path (day 6 to 7)
With `SEND_MODE` not live: submit the lead form, reply as the customer, book,
confirm with `C`, mark a no-show, mark Won, text STOP. Then call the number and
check the call report lands on the contact.

### 7. Go live with the approval gate on (day 8 to 14)
Set the business to Active on the Agency page. Leave autopilot off. Review the
Inbox with the owner daily for the first week.

### 8. Turn on autopilot (day 14)
Only when the owner says so. Book the 30-day review.

## Outputs
- An active business in the app, reachable at `/app` (switch business in the sidebar)
- Public lead form at `/f/<slug>`
- A phone attendant in ElevenLabs (Growth and Premium)

## Rules
- Texts go only to people who clearly said yes. Never bulk-import a list as
  "text OK" unless the client can show consent.
- New clients always start with autopilot off.
- Never put treatment or health details in a message for a medical or dental
  client. Reminders carry the time and place only.
- Sending from the client's business address and number, never a personal one.
- Do not promise the client's customers anything the fact sheet does not confirm.

## Edge Cases
- **No booking link yet:** leave it blank; messages still go out, and the
  agents take a message instead of booking. Set one up before go-live.
- **Client wants to keep their existing number:** forward it to the Twilio
  number (fastest) or port it (one to four weeks).
- **Landline-only customers:** they land on the call list on the Today page.
- **The provisioning script returns 401:** `AGENCY_API_KEY` in `execution/.env`
  does not match the one on the server.

## Learnings
- (Update this section as you discover API limits, errors, or edge cases)
