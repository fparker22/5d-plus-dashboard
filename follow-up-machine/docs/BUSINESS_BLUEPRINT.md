# Business blueprint

How to sell, price, deliver and grow the Follow-Up Machine as an agency service.
Vendor prices below are approximate and from memory; check each vendor's
pricing page before you quote a client or commit to a margin.

## The offer in one sentence

We install and run an AI front office for small businesses and organizations:
every call answered, every lead replied to in under a minute, every appointment
reminded, every customer asked for a review, and everyone who did not buy kept
in touch with until they do or ask us to stop.

## Who it is for

Businesses where a missed call or a slow reply is lost money, and where the
owner is too busy doing the work to chase leads:

| Segment | Why it fits | What a new customer is worth |
|---|---|---|
| Home services (HVAC, plumbing, roofing, electrical, landscaping) | Calls come in while the crew is on a job; high ticket | $300 to $10,000+ |
| Dental, chiropractic, med spa, optometry | No-shows and recall are the whole game | $500 to $5,000 lifetime |
| Salons, barbers, fitness studios | Repeat visits, reviews, rebooking | $50 to $150 a visit, many visits |
| Law, insurance, real estate, financial offices | Speed to lead decides who gets the client | $1,000 to $20,000+ |
| Churches and nonprofits | Guests, volunteers, donors and events all need follow-up | Measured in people, not dollars |

Start with one segment you already know. The Feed Jackson and Kingdom Life
system is a working case study for churches and nonprofits; pick one for-profit
segment next (home services is the easiest to prove ROI in).

## What we carried over from Feed Jackson and Kingdom Life

The product is that system, generalized. These are the rules that made it work
and where each one lives in the product:

| Proven rule | In the product |
|---|---|
| The phone agent always says it is an AI, and never pretends to be the pastor | Every agent prompt (`lib/agents.ts`), plus a "Disclosed AI assistant" check on every call |
| Answer only from the facts document; otherwise take a message | The per-business fact sheet in Settings; agents refuse to guess |
| Every call is logged with category, status, owner, urgency and "text OK" | Contacts, the history timeline, the call list, and the post-call webhook |
| Same-day thank-you with Confirm and Switch buttons | Instant acknowledgement, and replying C or R to confirm or reschedule |
| No email on file: goes on the morning report for a person to call | The "Needs a person" call list on the Today page |
| Day-before reminder and a thank-you afterwards | The appointment and review sequences |
| Texts only with a clear yes; skip anyone who opted out | The Compliance Guard (`lib/compliance.ts`), which has no override |
| Automatic sending only runs while the pastor has it turned on | Autopilot, per business; when off, every message waits for approval |
| Never promise anything that is not confirmed | Agents hand off instead of committing; low-star review replies need the owner |

## The three plans

List prices are a recommended starting point. Sell monthly, no long contract,
with a one-time setup fee that covers onboarding.

| | Follow-Up Machine | AI Front Office | Complete Business System |
|---|---|---|---|
| Monthly | $297 | $697 | $1,497 |
| Setup | $497 | $997 | $1,997 |
| The promise | Nobody falls through the cracks | Every call and text answered, day or night | Front office plus a marketing team |
| Lead form and contact database | Yes | Yes | Yes |
| Instant text and email reply | Yes | Yes | Yes |
| Missed-call text-back | Yes | Yes | Yes |
| Appointment reminders | Yes | Yes | Yes |
| Review requests | Yes | Yes | Yes |
| Daily briefing and dashboard | Yes | Yes | Yes |
| AI phone attendant, 24/7 | | 300 minutes | 1,000 minutes |
| Two-way AI replies by text and email | | Yes | Yes |
| Lead scoring | | Yes | Yes |
| Agent books appointments | | Yes | Yes |
| No-show recovery | | Yes | Yes |
| Long-term drip and win-back | | Yes | Yes |
| Drafted review replies | | Yes | Yes |
| Content calendar and 16 posts a month | | | Yes |
| Image and short-video creative | | | Yes |
| Scheduling and analytics on every network | | | Yes |
| Outbound AI call campaigns | | | Yes |
| Monthly strategy call | | | Yes |
| Contacts | 500 | 2,500 | 10,000 |

Add-ons: extra voice minutes at $0.25, extra location or line $97 a month,
landing page from $750, ads management $500 a month plus spend, database
import $250. Nonprofits and congregations: 20% off any plan.

Why these numbers: Starter has to be an easy yes for a business that recovers
one job a month. Growth is priced well under a part-time receptionist
(roughly $1,500 to $2,500 a month) and does more hours. Premium is priced under
a junior marketing hire or a typical social-media retainer plus a receptionist.

### Guarantee to consider

"If the system doesn't book you at least five appointments in the first 60
days, the next month is free." It is easy to honor for any business with real
lead flow, and the dashboard proves the count.

## What it costs to deliver

Shared costs are paid once for the whole agency, so they shrink per client as
you grow. The app is multi-tenant: one deployment, one database, many clients.

**Shared, per month (covers the first 10 to 20 clients)**

| Item | Approximate cost |
|---|---|
| Hosting (Vercel or Netlify) | $0 to $20 |
| Supabase (free to start, Pro when you have paying clients) | $0 to $25 |
| Resend (free up to about 3,000 emails, then Pro) | $0 to $20 |
| ElevenLabs plan (voice agent minutes pool) | $22 to $99+ |
| Metricool (agency plan, multiple brands) | $50 to $170 |
| Higgsfield (creative credits) | $30 to $100 |

**Per client, per month**

| Item | Starter | Growth | Premium |
|---|---|---|---|
| Twilio number | about $1.15 | about $1.15 | about $1.15 to $3.50 |
| A2P 10DLC campaign fee | about $2 to $10 | same | same |
| Texts (about $0.011 each with carrier fees) | 600 texts: about $7 | 2,000: about $22 | 3,000: about $33 |
| Voice minutes (agent about $0.08 to $0.10, plus Twilio about $0.01) | none | 300 min: about $30 | 1,000 min: about $100 |
| Claude (see below) | under $1 | about $5 to $25 | about $10 to $40 |
| Share of Metricool and Higgsfield | none | none | about $40 to $90 |
| **Estimated total** | **$20 to $45** | **$90 to $170** | **$260 to $420** |
| **Gross margin at list price** | **about 85 to 93%** | **about 76 to 87%** | **about 72 to 83%** |

A Starter client stays under the $50 a month target. One-time per client:
A2P 10DLC brand registration (about $4) and campaign vetting (about $15).

**Claude cost per message.** A text reply uses roughly 1,500 input tokens and
150 output tokens. On Claude Opus 5.5 ($4 and $20 per million tokens) that is
under one cent; on Claude Haiku 5.5 ($0.10 and $0.50) it is a small fraction of
a cent. The app defaults to Opus 5.5 for quality; set `ANTHROPIC_MODEL` to
change it. The voice agent's model is chosen inside ElevenLabs (Kingdom Life
runs on Haiku 5.5).

**Your time** is the real cost: about 4 to 8 hours to onboard a client, then
1 to 2 hours a month on Starter and Growth and 4 to 6 on Premium (content
review, strategy call). Price your time into the setup fee.

## Revenue targets

| Clients | Mix (Starter / Growth / Premium) | Monthly recurring | Est. delivery cost |
|---|---|---|---|
| 5 | 3 / 2 / 0 | $2,285 | about $350 to $600 |
| 10 | 4 / 5 / 1 | $6,170 | about $900 to $1,500 |
| 25 | 8 / 13 / 4 | $17,425 | about $2,600 to $4,400 |

The demo data in the app (one client per plan) shows $2,491 a month.

## How to sell it

1. **Lead with the demo, not the deck.** Open `/app`, switch to the business
   closest to the prospect's, and run "Demo a missed call" on the Automations
   page while they watch the text-back appear.
2. **The missed-call audit.** Before the meeting, call the business after
   hours and note what happens. "I called you Tuesday at 6:40. It rang out.
   Here is what would have happened instead."
3. **Do the math with them.** Missed calls a week × close rate × average job.
   One recovered job usually pays for the year.
4. **Start them on the plan they will say yes to today.** Upgrade when the
   daily briefing shows replies they did not have time to answer.
5. **Channels:** your own network and church relationships first, then a
   local Chamber or BNI talk ("Why 60% of your calls go unanswered"), then
   partnerships with web designers and bookkeepers who already serve small
   businesses and do not offer this.

Use the product on your own agency: your sales page is `/`, your lead form
is a tenant, and prospects experience the follow-up they are buying.

## Delivery: the first 14 days

See `directives/onboard_followup_client.md` at the repo root for the step-by-step.

| Day | What happens |
|---|---|
| 0 | Signed and paid. Send the intake form: hours, services, prices, policies, booking link, review link, logins needed. |
| 1 to 2 | Create the business (Agency page or the provisioning script). Write the fact sheet. Start A2P 10DLC registration, since it can take days. |
| 3 to 5 | Tune message wording with the owner. Build the phone attendant (Growth and up). Connect the number. |
| 6 to 7 | Test every path yourself in test mode. Owner approves messages with autopilot off. |
| 8 to 14 | Go live with autopilot off; review the approval queue daily with the owner. |
| 14 | Turn autopilot on when the owner is comfortable. Book the 30-day review. |

## Rules you must follow (not legal advice)

Have a lawyer review your client agreement and consent wording before you sell.

- **Texting (TCPA, carrier rules).** Marketing texts need prior express written
  consent. The lead form's checkbox wording covers this; keep the record. Every
  first text carries "Reply STOP to opt out," and STOP is honored instantly.
  Register each client's brand and campaign for A2P 10DLC, or carriers will
  filter the messages.
- **Sending hours.** The system holds texts and calls to 8 a.m. to 8 p.m. local
  time by default. Federal rules allow 8 a.m. to 9 p.m.; several states are
  stricter. The one exception is a direct reply to something the person just
  did (submitted the form, called, booked, texted): that goes out right away
  at any hour, because they are waiting for it.
- **Missed-call text-back** replies to someone who just called the business.
  Keep that first message informational, not promotional.
- **AI calls.** The FCC treats AI-generated voices as "artificial" under the
  TCPA, so outbound AI calls to cell phones need prior express consent, and
  written consent for marketing. Inbound answering is the low-risk use. The
  agents always disclose that they are an AI.
- **Call recording.** Some states require everyone on the call to consent. Add
  "this call may be recorded" to the greeting where needed.
- **Email (CAN-SPAM).** Real business address in the footer and a working
  unsubscribe for marketing emails. Add both to the nurture templates before
  going live with them.
- **Health information.** Dental and medical clients are covered by HIPAA. Do
  not put treatment details in texts, and do not onboard a practice until you
  have business associate agreements with every vendor that will touch patient
  information. Appointment reminders with no clinical detail are the safe scope.
- **Reviews.** Ask every customer, not only the happy ones, and never offer an
  incentive. Routing only happy customers to Google violates platform rules.
- **Your contract** should say the client owns their data, is responsible for
  the accuracy of the fact sheet, and authorizes you to send on their behalf.
