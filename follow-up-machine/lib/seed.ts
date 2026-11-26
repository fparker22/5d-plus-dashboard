import { DEFAULT_SEQUENCES, DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from "./defaults";
import { SOURCE_LABEL } from "./types";
import type {
  Activity,
  Appointment,
  Contact,
  Enrollment,
  LeadSource,
  Review,
  Sequence,
  SocialPost,
  StageId,
  TableMap,
  TableName,
  Task,
  Template,
  Tenant,
} from "./types";

// Demo data: three fictional client businesses, one on each plan.
// All names, numbers (555-01xx) and addresses are made up.

type Db = { [K in TableName]: TableMap[K][] };

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Marcus", "Denise", "Tamika", "Andre", "Renee", "Calvin", "Priya", "Luis", "Hannah", "Darnell", "Sofia", "Jerome", "Keisha", "Brian", "Monique", "Trevor", "Aaliyah", "Victor", "Nia", "Curtis", "Elena", "Malik", "Grace", "Omar", "Joy", "Terrence", "Bianca", "Reggie", "Ines", "Wes"];
const LAST = ["Holloway", "Brooks", "Okafor", "Reyes", "Whitfield", "Simmons", "Patel", "Dawson", "Greer", "Carter", "Nguyen", "Banks", "Ellis", "Fontaine", "Hughes", "Mbeki", "Sutton", "Price", "Alvarez", "Kim"];

interface TenantSeed {
  tenant: Tenant;
  interests: string[];
  values: number[];
  contactCount: number;
  inbound: string[];
}

const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function tenants(): TenantSeed[] {
  const created = iso(now() - 120 * DAY);
  return [
    {
      tenant: {
        id: "tnt_parkside",
        slug: "parkside-heating",
        name: "Parkside Heating & Air",
        industry: "heating and cooling",
        plan: "growth",
        monthlyPrice: 697,
        status: "active",
        tagline: "Comfort you can count on, from a family-owned crew.",
        knowledgeBase:
          "Hours: Monday to Friday 7 a.m. to 6 p.m., Saturday 8 a.m. to 2 p.m. Emergency service is available 24/7.\nService area: Jackson County and the surrounding 25 miles.\nDiagnostic visit: $89, applied to the repair if the customer goes ahead.\nSeasonal tune-up: $129 per system.\nNew system estimates are free and take about 45 minutes in the home.\nFinancing is available through a partner lender; approval is not guaranteed.\nAddress: 410 Parkside Avenue.",
        services: ["Furnace repair", "AC repair", "Seasonal tune-ups", "New system installation", "Indoor air quality"],
        settings: {
          ...DEFAULT_SETTINGS,
          bookingUrl: "https://book.example.com/parkside",
          reviewUrl: "https://reviews.example.com/parkside",
          website: "https://parkside.example.com",
          fromName: "Parkside Heating & Air",
          fromEmail: "hello@parkside.example.com",
          phone: "+15175550142",
          forwardPhone: "+15175550143",
          ownerName: "Dana Whitfield",
          ownerEmail: "dana@parkside.example.com",
          brandColor: "#0F3D3E",
          voiceTone: "Friendly and practical, like a neighbor who happens to fix furnaces.",
        },
        createdAt: created,
      },
      interests: ["furnace not heating", "AC tune-up", "new furnace estimate", "thermostat replacement", "strange noise from the vents", "annual maintenance plan"],
      values: [129, 240, 380, 620, 4800, 7200],
      contactCount: 46,
      inbound: ["Yes, can someone come out tomorrow morning?", "How much is a tune-up?", "Thanks, I booked for Thursday.", "Do you offer financing?", "Is the $89 visit fee waived if I do the repair?"],
    },
    {
      tenant: {
        id: "tnt_glow",
        slug: "glow-studio",
        name: "Glow Studio Salon",
        industry: "hair and beauty",
        plan: "starter",
        monthlyPrice: 297,
        status: "active",
        tagline: "Color, cuts and care in the heart of downtown.",
        knowledgeBase:
          "Hours: Tuesday to Saturday 9 a.m. to 7 p.m. Closed Sunday and Monday.\nNew clients get a free 15-minute consultation.\nHaircuts start at $45. Color starts at $95. Silk press starts at $70.\nA card on file is required to hold a color appointment.\nAddress: 22 Mechanic Street, Suite B.",
        services: ["Cuts", "Color", "Silk press", "Braids", "Bridal styling"],
        settings: {
          ...DEFAULT_SETTINGS,
          autopilot: false,
          bookingUrl: "https://book.example.com/glow",
          reviewUrl: "https://reviews.example.com/glow",
          website: "https://glow.example.com",
          fromName: "Glow Studio",
          fromEmail: "hello@glow.example.com",
          phone: "+15175550167",
          forwardPhone: "+15175550168",
          ownerName: "Monique Fontaine",
          ownerEmail: "monique@glow.example.com",
          brandColor: "#8A3B5E",
          voiceTone: "Upbeat and personal. First names, no jargon.",
        },
        createdAt: created,
      },
      interests: ["color consultation", "silk press", "bridal party styling", "braids", "haircut"],
      values: [45, 70, 95, 180, 650],
      contactCount: 22,
      inbound: ["Do you have anything Saturday?", "How long does a silk press take?", "Booked! See you Friday."],
    },
    {
      tenant: {
        id: "tnt_summit",
        slug: "summit-dental",
        name: "Summit Family Dental",
        industry: "family dentistry",
        plan: "premium",
        monthlyPrice: 1497,
        status: "active",
        tagline: "Gentle dentistry for every age.",
        knowledgeBase:
          "Hours: Monday to Thursday 8 a.m. to 5 p.m., Friday 8 a.m. to 1 p.m.\nNew patient exam with X-rays and cleaning: $99 without insurance.\nMost major dental insurance plans are accepted; the office verifies coverage before the visit.\nSame-day emergency appointments are held each morning.\nServices include cleanings, fillings, crowns, whitening and clear aligners.\nAddress: 1800 Summit Road.",
        services: ["Cleanings and exams", "Fillings and crowns", "Whitening", "Clear aligners", "Emergency visits"],
        settings: {
          ...DEFAULT_SETTINGS,
          bookingUrl: "https://book.example.com/summit",
          reviewUrl: "https://reviews.example.com/summit",
          website: "https://summit.example.com",
          fromName: "Summit Family Dental",
          fromEmail: "care@summit.example.com",
          phone: "+15175550190",
          forwardPhone: "+15175550191",
          ownerName: "Dr. Elena Alvarez",
          ownerEmail: "office@summit.example.com",
          brandColor: "#1D4E89",
          voiceTone: "Calm and reassuring. Many callers are nervous about the dentist.",
        },
        createdAt: created,
      },
      interests: ["new patient exam", "whitening", "clear aligners consult", "toothache", "kids cleaning", "crown"],
      values: [99, 180, 350, 1200, 4200],
      contactCount: 38,
      inbound: ["Do you take Delta Dental?", "I have a toothache, can I come in today?", "Yes that time works.", "What does whitening cost?"],
    },
  ];
}

const STAGE_MIX: StageId[] = ["new", "new", "contacted", "contacted", "contacted", "engaged", "engaged", "booked", "booked", "won", "won", "won", "nurture", "nurture", "lost"];
const SOURCES: LeadSource[] = ["web_form", "web_form", "phone", "missed_call", "referral", "social", "walk_in", "sms"];

export function buildSeed(): Db {
  const data: Db = {
    tenants: [],
    contacts: [],
    activities: [],
    sequences: [],
    enrollments: [],
    templates: [],
    appointments: [],
    reviews: [],
    social_posts: [],
    tasks: [],
  };
  let n = 0;
  const id = (p: string) => `${p}_seed${(++n).toString(36)}`;

  tenants().forEach((seed, tIndex) => {
    const t = seed.tenant;
    const rand = rng(1000 + tIndex * 77);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    data.tenants.push(t);

    DEFAULT_TEMPLATES.forEach((tpl) => data.templates.push({ ...tpl, id: id("tpl"), tenantId: t.id } satisfies Template));
    DEFAULT_SEQUENCES.forEach((seq) =>
      data.sequences.push({ ...seq, steps: seq.steps.map((s) => ({ ...s })), id: id("seq"), tenantId: t.id } satisfies Sequence),
    );

    const act = (a: Partial<Activity> & Pick<Activity, "contactId" | "type" | "summary" | "createdAt">) =>
      data.activities.push({
        id: id("act"),
        tenantId: t.id,
        status: "logged",
        agent: "concierge",
        body: "",
        subject: "",
        sequenceKey: "",
        meta: {},
        ...a,
      } satisfies Activity);

    for (let i = 0; i < seed.contactCount; i++) {
      const firstName = FIRST[(i * 7 + tIndex * 3) % FIRST.length];
      const lastName = LAST[(i * 3 + tIndex * 5) % LAST.length];
      const stage = STAGE_MIX[(i + tIndex) % STAGE_MIX.length];
      const source = pick(SOURCES);
      // Newer stages skew recent; won / nurture skew older.
      const ageDays =
        stage === "new" ? rand() * 1.5 : stage === "contacted" ? 1 + rand() * 5 : stage === "engaged" ? 1 + rand() * 8 : 4 + rand() * 26;
      const createdMs = now() - ageDays * DAY;
      const interest = pick(seed.interests);
      // In a working system nobody stays "New" for more than a minute unless the
      // team cannot message them (no email, no permission to text) or the
      // owner has not approved the first message yet.
      const unreachable = stage === "new" && t.settings.autopilot;
      const hasEmail = unreachable ? false : rand() > 0.12;
      const hasPhone = unreachable ? true : rand() > 0.05;
      const smsConsent = unreachable ? false : hasPhone && rand() > 0.15;
      const optedOut = stage === "lost" && rand() > 0.4;
      const c: Contact = {
        id: id("con"),
        tenantId: t.id,
        firstName,
        lastName,
        email: hasEmail ? `${firstName}.${lastName}`.toLowerCase() + "@example.com" : "",
        phone: hasPhone ? `+1517555${String(1000 + ((i * 37 + tIndex * 211) % 9000)).padStart(4, "0")}` : "",
        source,
        stage,
        interest,
        tags: rand() > 0.7 ? ["returning"] : [],
        smsConsent,
        emailConsent: hasEmail,
        optedOut,
        urgent: false,
        score: Math.round(35 + rand() * 60),
        value: pick(seed.values),
        owner: t.settings.ownerName,
        createdAt: iso(createdMs),
        lastOutboundAt: null,
        lastInboundAt: null,
      };
      data.contacts.push(c);

      act({
        contactId: c.id,
        type: source === "missed_call" ? "missed_call" : source === "phone" ? "call_in" : "lead_created",
        agent: source === "phone" ? "receptionist" : "concierge",
        summary:
          source === "missed_call"
            ? "Missed call"
            : source === "phone"
              ? `Called about ${interest}`
              : `New lead from ${SOURCE_LABEL[source]}: ${interest}`,
        body: source === "phone" ? `Caller asked about ${interest}. Took name and number, offered the booking link, asked permission to text.` : "",
        createdAt: iso(createdMs),
      });

      if (stage === "new") {
        if (unreachable) {
          data.tasks.push({ id: id("tsk"), tenantId: t.id, contactId: c.id, title: `Call ${firstName} ${lastName}`, detail: `Asked about ${interest}. No email on file and no permission to text, so the system can't follow up automatically.`, urgent: false, status: "open", dueAt: iso(now()), createdAt: iso(createdMs) } satisfies Task);
        } else {
          if (smsConsent) act({ contactId: c.id, type: "sms_out", status: "pending_approval", summary: "New lead — instant text — waiting for your OK", body: `Hi ${firstName}, this is ${t.name}. Thanks for reaching out about ${interest}. You can grab a time here: ${t.settings.bookingUrl} — or just reply to this text with any questions. Reply STOP to opt out.`, sequenceKey: "new_lead", createdAt: iso(createdMs + 20_000) });
          data.enrollments.push({ id: id("enr"), tenantId: t.id, contactId: c.id, sequenceKey: "new_lead", stepIndex: 2, nextRunAt: iso(createdMs + DAY), status: "active", stoppedReason: "", appointmentId: "", createdAt: iso(createdMs) } satisfies Enrollment);
        }
        continue;
      }
      if (!hasPhone && !hasEmail) continue;
      const sim = "sent" as const;
      const firstTouch = createdMs + 40_000;
      if (smsConsent) {
        act({ contactId: c.id, type: "sms_out", status: sim, summary: "Instant acknowledgement text", body: `Hi ${firstName}, this is ${t.name}. Thanks for reaching out about ${interest}. You can grab a time here: ${t.settings.bookingUrl}`, sequenceKey: source === "missed_call" ? "missed_call" : "new_lead", createdAt: iso(firstTouch) });
        c.lastOutboundAt = iso(firstTouch);
      }
      if (hasEmail) {
        act({ contactId: c.id, type: "email_out", status: sim, summary: "Instant acknowledgement email", subject: `We got your request, ${firstName}`, body: `Thank you for contacting ${t.name}.`, sequenceKey: "new_lead", createdAt: iso(firstTouch + 5000) });
        c.lastOutboundAt = iso(firstTouch + 5000);
      }

      act({ contactId: c.id, type: "stage_change", agent: "concierge", summary: "Moved to Contacted", createdAt: iso(firstTouch + 10_000) });
      if (stage === "contacted") {
        const next = createdMs + (ageDays > 3 ? 7 : ageDays > 1 ? 3 : 1) * DAY;
        if (ageDays > 1 && smsConsent) act({ contactId: c.id, type: "sms_out", status: sim, agent: "closer", summary: "Follow-up 1", body: `Hi ${firstName}, it's ${t.name} checking in. Still need help with ${interest}?`, sequenceKey: "new_lead", createdAt: iso(createdMs + DAY) });
        data.enrollments.push({ id: id("enr"), tenantId: t.id, contactId: c.id, sequenceKey: "new_lead", stepIndex: ageDays > 3 ? 4 : 3, nextRunAt: iso(Math.max(next, now() + 2 * HOUR)), status: "active", stoppedReason: "", appointmentId: "", createdAt: iso(createdMs) } satisfies Enrollment);
        continue;
      }

      if (stage === "lost") {
        if (optedOut) act({ contactId: c.id, type: "sms_in", status: "received", agent: "compliance", summary: "Opted out", body: "STOP", createdAt: iso(createdMs + 2 * HOUR) });
        continue;
      }

      // Everyone past "contacted" replied at least once.
      const replyAt = createdMs + (0.5 + rand() * 20) * HOUR;
      const reply = pick(seed.inbound);
      act({ contactId: c.id, type: "sms_in", status: "received", agent: "closer", summary: "Replied by text", body: reply, createdAt: iso(replyAt) });
      c.lastInboundAt = iso(replyAt);
      if (t.plan !== "starter") {
        act({ contactId: c.id, type: "sms_out", status: sim, agent: "closer", summary: "AI reply", body: `Happy to help, ${firstName}. The quickest way to get on the schedule is ${t.settings.bookingUrl} — or tell me a day that works and I'll set it up.`, createdAt: iso(replyAt + 45_000) });
        c.lastOutboundAt = iso(replyAt + 45_000);
      }
      act({ contactId: c.id, type: "stage_change", agent: "closer", summary: "Moved to Engaged", createdAt: iso(replyAt + 1000) });

      if (stage === "engaged") {
        if (t.plan === "starter" && rand() > 0.4) {
          data.tasks.push({ id: id("tsk"), tenantId: t.id, contactId: c.id, title: `Reply to ${firstName} ${lastName}`, detail: `They texted: "${reply}"`, urgent: false, status: "open", dueAt: iso(now()), createdAt: iso(replyAt) } satisfies Task);
        }
        continue;
      }

      if (stage === "nurture") {
        act({ contactId: c.id, type: "stage_change", agent: "nurture", summary: "Moved to Nurture — not ready yet", createdAt: iso(replyAt + 3 * DAY) });
        data.enrollments.push({ id: id("enr"), tenantId: t.id, contactId: c.id, sequenceKey: "nurture", stepIndex: 0, nextRunAt: iso(now() + (1 + rand() * 12) * DAY), status: "active", stoppedReason: "", appointmentId: "", createdAt: iso(replyAt + 3 * DAY) } satisfies Enrollment);
        continue;
      }

      // booked or won → an appointment exists
      const won = stage === "won";
      const startMs = won ? createdMs + (1 + rand() * 3) * DAY : now() + (0.2 + rand() * 6) * DAY;
      const start = new Date(startMs);
      start.setUTCHours(14 + Math.floor(rand() * 7), rand() > 0.5 ? 0 : 30, 0, 0); // business hours, Eastern
      const appt: Appointment = {
        id: id("apt"),
        tenantId: t.id,
        contactId: c.id,
        title: interest.charAt(0).toUpperCase() + interest.slice(1),
        startsAt: start.toISOString(),
        durationMinutes: pick([30, 45, 60, 90]),
        location: t.industry === "heating and cooling" ? "Customer's home" : "In office",
        status: won ? "completed" : rand() > 0.5 ? "confirmed" : "scheduled",
        bookedBy: t.plan === "starter" ? "owner" : pick(["closer", "receptionist", "scheduler"]),
        createdAt: iso(replyAt + HOUR),
      };
      data.appointments.push(appt);
      act({ contactId: c.id, type: "appointment", agent: appt.bookedBy, summary: `Booked: ${appt.title}`, createdAt: iso(replyAt + HOUR) });
      act({ contactId: c.id, type: "stage_change", agent: "scheduler", summary: "Moved to Booked", createdAt: iso(replyAt + HOUR + 1000) });
      if (!won) {
        if (smsConsent) data.enrollments.push({ id: id("enr"), tenantId: t.id, contactId: c.id, sequenceKey: "appointment", stepIndex: 2, nextRunAt: iso(start.getTime() - DAY), status: "active", stoppedReason: "", appointmentId: appt.id, createdAt: iso(replyAt + HOUR) } satisfies Enrollment);
        continue;
      }
      act({ contactId: c.id, type: "stage_change", agent: "owner", summary: "Marked Won", createdAt: iso(start.getTime() + 3 * HOUR) });
      if (smsConsent) act({ contactId: c.id, type: "sms_out", status: sim, agent: "reputation", summary: "Review request", body: `Thanks for choosing ${t.name}, ${firstName}. Would you take 30 seconds to share how it went? ${t.settings.reviewUrl}`, sequenceKey: "review", createdAt: iso(start.getTime() + 5 * HOUR) });
      const reviewed = rand() > 0.45;
      const rating = rand() > 0.15 ? 5 : rand() > 0.5 ? 4 : 2;
      const review: Review = {
        id: id("rev"),
        tenantId: t.id,
        contactId: c.id,
        platform: "Google",
        rating: reviewed ? rating : 0,
        text: reviewed
          ? rating >= 4
            ? pick(["Showed up on time and explained everything. Highly recommend.", "Easy to book and so friendly. Will be back.", "They followed up right away and got me in the same week."])
            : "Had to wait longer than I expected."
          : "",
        status: reviewed ? (rating >= 4 && t.plan !== "starter" ? "responded" : "received") : "requested",
        response: reviewed && rating >= 4 && t.plan !== "starter" ? `Thank you, ${firstName}! We're glad we could help.` : "",
        createdAt: iso(start.getTime() + (reviewed ? 20 : 5) * HOUR),
      };
      data.reviews.push(review);
      if (reviewed) act({ contactId: c.id, type: "review", agent: "reputation", summary: `Left a ${rating}-star review`, body: review.text, createdAt: review.createdAt });
      if (reviewed && rating < 4) {
        data.tasks.push({ id: id("tsk"), tenantId: t.id, contactId: c.id, title: `Respond to ${firstName}'s ${rating}-star review`, detail: review.text, urgent: true, status: "open", dueAt: iso(now()), createdAt: review.createdAt } satisfies Task);
      }
    }

    if (t.plan === "premium") {
      const posts: [string, string, string, number, SocialPost["status"]][] = [
        ["New patient special", "New here? Your first exam, X-rays and cleaning are $99. Gentle hands, no judgment, and a team that remembers your name.", "Bright, welcoming photo of a dental team greeting a family at the front desk, natural light", -3, "published"],
        ["Meet the team", "Meet Jasmine, our hygienist of nine years. Ask her about her sourdough starter while she makes your teeth sparkle.", "Candid portrait of a smiling dental hygienist in a modern operatory", -1, "published"],
        ["Whitening season", "Wedding and graduation photos are coming. In-office whitening takes about an hour and can brighten your smile several shades.", "Close-up of a confident smile outdoors in golden-hour light", 1, "scheduled"],
        ["Kids and cavities", "Three snack swaps that are kinder to little teeth: cheese cubes, apple slices and water instead of juice.", "Flat-lay of healthy kids' snacks on a light blue background", 3, "scheduled"],
        ["Emergency visits", "Toothache at 8 a.m.? We hold same-day emergency appointments every morning. Call and we'll get you in.", "Calm, reassuring image of a patient talking with a dentist", 5, "pending_approval"],
        ["Clear aligners Q&A", "Wondering whether clear aligners are right for you? Send us your questions and Dr. Alvarez will answer the top five next week.", "Short vertical video concept: dentist answering questions to camera, captions on screen", 8, "pending_approval"],
        ["Community", "Idea: a back-to-school mouthguard giveaway for local youth sports teams.", "", 0, "idea"],
      ];
      posts.forEach(([campaign, caption, mediaPrompt, dayOffset, status]) => {
        const when = new Date(now() + dayOffset * DAY);
        when.setUTCHours(16, 30, 0, 0); // late morning, Eastern
        data.social_posts.push({
          id: id("pst"),
          tenantId: t.id,
          campaign,
          platforms: status === "idea" ? [] : ["facebook", "instagram"],
          caption,
          mediaPrompt,
          mediaUrl: "",
          scheduledAt: status === "idea" ? null : when.toISOString(),
          status,
          externalId: "",
          createdAt: iso(now() - 6 * DAY),
        } satisfies SocialPost);
      });
    }
  });

  return data;
}
