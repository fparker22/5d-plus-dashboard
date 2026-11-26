# Follow-Up Machine

An AI front office you can sell to small businesses and organizations: a team
of agents that answers calls, replies to every lead in under a minute, books
and reminds appointments, asks for reviews, runs social content, and keeps in
touch with everyone who did not buy.

It is one multi-tenant app. You run it once and add each client as a business.

- **Business plan, pricing and unit economics:** [docs/BUSINESS_BLUEPRINT.md](docs/BUSINESS_BLUEPRINT.md)
- **What is built, what is untested, and what comes next:** [docs/ROADMAP.md](docs/ROADMAP.md)
- **Client onboarding SOP:** `directives/onboard_followup_client.md` (repo root)

## Try it in two minutes

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. With no settings at all the app runs on built-in
demo data (three fictional businesses, one per plan) and sends nothing.

| Where | What it is |
|---|---|
| `/` | Your agency's sales page, with the three plans |
| `/app` | The dashboard a client (or you) works in |
| `/agency` | Every client on one page: plan, health, revenue, add a client |
| `/f/parkside-heating` | A client's public lead form |

A good five-minute demo: submit the lead form, open the new contact, expand
"Demo: play the customer's reply" and answer as the customer, book an
appointment, reply `C`, then mark the contact Won and watch the review request
queue. On the Automations page, "Demo a missed call" shows the text-back.

## How it works

```
lead form ─┐
inbound text ─┤                      ┌─ Compliance Guard ─ consent? opted out? sending hours?
missed call ─┼─► engine (lib/engine.ts) ─┤
phone agent ─┘        │              └─ autopilot off? ─► approval queue ─► owner's OK
                      │
                      ├─ contact + history + stage
                      ├─ sequences (7) ─► text / email / call
                      └─ tasks for a person ─► daily briefing
```

| File | What lives there |
|---|---|
| `lib/engine.ts` | Everything that happens to a contact |
| `lib/agents.ts` | The 13 agents, the house rules, and the phone attendant's script |
| `lib/defaults.ts` | The starter kit: 21 messages and 7 sequences every client gets |
| `lib/plans.ts` | The three plans and which features each unlocks |
| `lib/compliance.ts` | Consent, opt-out and sending-hours rules |
| `lib/providers/` | Twilio, Resend, ElevenLabs, Metricool and Claude |
| `lib/store.ts` | Data access: demo memory store or Supabase |
| `supabase/schema.sql` | The database |
| `scripts/smoke.ts` | End-to-end test of the engine |

Check the engine at any time:

```bash
npx tsx scripts/smoke.ts
```

## Going live

Copy `.env.example` to `.env.local` and fill it in as you go. Nothing reaches a
real person until `SEND_MODE=live`.

1. **Database.** Create a Supabase project, run `supabase/schema.sql` in the SQL
   editor, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The demo
   businesses disappear; add real ones from `/agency`.
2. **Password.** Set `APP_PASSWORD`. It gates `/app` and `/agency`.
3. **Deploy** to Vercel, Netlify or any Node host. Set `PUBLIC_BASE_URL` to the
   deployed address.
4. **Heartbeat.** Schedule a request every five minutes:
   `GET <your address>/api/cron/tick` with header `Authorization: Bearer <CRON_SECRET>`.
   This sends every sequence step that has fallen due.
5. **Texting.** Add Twilio keys. On each client's number set:
   - Messaging webhook: `POST <your address>/api/webhooks/twilio/sms?tenant=<slug>`
   - Voice webhook (Starter plan, missed-call text-back): `POST <your address>/api/webhooks/twilio/voice?tenant=<slug>`
   Register the brand and campaign for A2P 10DLC before sending volume.
6. **Email.** Add `RESEND_API_KEY` and verify each client's sending domain.
7. **AI.** Add `ANTHROPIC_API_KEY`. Without it, replies and scoring use simple rules.
8. **Phone attendant (AI Front Office and up).**

   ```bash
   ELEVENLABS_API_KEY=... npx tsx scripts/sync-voice-agent.ts <business-slug> <voice_id>
   ```

   This builds the agent from the business's fact sheet. In ElevenLabs, attach
   it to the client's number, set the post-call webhook to
   `<your address>/api/webhooks/elevenlabs?tenant=<slug>`, and add the two tools
   described in `app/api/agent-tools/route.ts`.
9. **Social (Complete Business System).** Add Metricool keys and put the
   client's brand ID in their Settings.
10. Set `SEND_MODE=live`, and leave each new client's autopilot off until they
    have approved a week of messages.

## Adding a client

From `/agency`, or from the command line:

```bash
python ../execution/provision_followup_client.py --name "Acme Plumbing" --plan growth --owner "Sam Lee"
```

Every new business gets the full starter kit and starts in onboarding with
autopilot off.

## Sending leads in from anywhere

```bash
curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{"tenant":"parkside-heating","firstName":"Sam","phone":"5175550100","email":"sam@example.com","interest":"AC tune-up","smsConsent":true}'
```

Any website form, landing page or ad platform that can post JSON or a regular
form can feed the system.
