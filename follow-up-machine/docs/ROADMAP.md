# Roadmap

## What exists today (v1)

Working and tested in this repo:

- Multi-tenant app: one deployment serves many client businesses.
- Contact database with stages, history, lead score, consent and opt-out.
- Lead intake from the hosted form (`/f/<slug>`), a public API (`/api/leads`),
  inbound texts, missed calls and phone-attendant call reports.
- The follow-up engine: seven sequences, quiet hours, consent checks, the
  approval gate, stop-on-reply, appointment-anchored reminders, a looping
  long-term drip, and win-back.
- Twilio texting and missed-call text-back, Resend email, Claude for scoring,
  replies, review replies and content plans, ElevenLabs outbound calls and
  post-call webhook, and in-call tools (look up caller, book appointment).
- Dashboard, inbox with approvals, pipeline, calendar, agents, automations,
  message editor, reviews, marketing calendar, settings, agency view.
- Sales page with the three plans.

Built but not yet run against live accounts (test before promising a client):

- The Supabase adapter and `supabase/schema.sql`.
- Live Twilio, Resend and ElevenLabs calls (request shapes follow their
  public APIs; the engine was verified in test mode).
- Metricool scheduling (`schedulePost`). Confirm the payload against
  Metricool's API reference during the first Premium onboarding.

## v1.1 — before the first paying client

1. Create the Supabase project, run the schema, and run the smoke test against it.
2. Deploy, set `APP_PASSWORD`, `CRON_SECRET` and `PUBLIC_BASE_URL`, and schedule
   `/api/cron/tick` every five minutes.
3. Send yourself a real text and email with `SEND_MODE=live`.
4. Register your agency's own brand for A2P 10DLC.
5. Add an unsubscribe link and mailing address to the marketing email templates.
6. Move the due-enrollment query into SQL (`next_run_at <= now()`), since the
   current tick loads active enrollments and filters in memory.

## v2 — the next quarter

| Item | Why |
|---|---|
| Per-user logins and client seats (Supabase Auth, row-level policies) | Clients sign in to their own business; you keep the agency view |
| Stripe billing tied to plans | Collect setup and monthly fees; pause service on failed payment |
| Two-way email (Resend inbound) | Email replies reach the Follow-Up Specialist the way texts do |
| Calendar sync (Google Calendar, Calendly webhooks) | Bookings made on the booking link create appointments automatically |
| Review monitoring (Google Business Profile API) | Pull reviews in and post replies without copy and paste |
| Drag-and-drop sequence builder | Edit steps and delays in the app instead of the starter kit |
| Usage metering per business | Enforce plan limits and bill overages |
| Twilio subaccounts per client | Clean separation, per-client numbers and 10DLC campaigns |
| Higgsfield generation from the Marketing page | Turn each post's creative brief into an image or clip in one click |
| Metricool analytics on the dashboard | Best time to post and what performed |
| CSV import | Bring a client's existing customer list in during onboarding |
| Weekly emailed report from the Chief of Staff | Owners who never log in still see the value |

## v3 — the platform

- White-label: custom domain and branding per agency, so other consultants can
  resell the system.
- Industry packs: pre-written fact sheets, sequences and content plans for
  home services, dental, salons and churches.
- A web chat widget that uses the same agents.
- WhatsApp and Spanish-language sequences.
- An agent that reviews call transcripts weekly and proposes fact-sheet updates.
