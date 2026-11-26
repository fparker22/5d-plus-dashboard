import { canContact, insideSendingHours, isOptIn, isOptOut, nextSendingTime, normalizePhone } from "./compliance";
import { hasFeature } from "./plans";
import { draftReply, qualifyLead } from "./providers/ai";
import { placeAgentCall, sendEmail, sendSms } from "./providers/messaging";
import { db, newId } from "./store";
import {
  fullName,
  SOURCE_LABEL,
  stageLabel,
  type Activity,
  type Appointment,
  type Channel,
  type Contact,
  type Enrollment,
  type LeadSource,
  type Sequence,
  type SequenceStep,
  type SequenceTrigger,
  type StageId,
  type Task,
  type Tenant,
} from "./types";

// The follow-up engine. Everything that happens to a contact goes through here:
// a lead arrives, a message goes out, a reply comes in, an appointment is
// booked, a sequence step falls due. Each function is deterministic apart from
// the two AI calls (qualify, draft reply), and each of those has a fallback.

const MINUTE = 60_000;

// ── Small helpers ────────────────────────────────────────────────────────────

export async function logActivity(
  a: Partial<Activity> & Pick<Activity, "tenantId" | "contactId" | "type" | "summary">,
): Promise<Activity> {
  return db().insert("activities", {
    id: newId("act"),
    status: "logged",
    agent: "owner",
    body: "",
    subject: "",
    sequenceKey: "",
    meta: {},
    createdAt: new Date().toISOString(),
    ...a,
  });
}

export async function addTask(
  tenant: Tenant,
  contactId: string,
  title: string,
  detail: string,
  urgent = false,
): Promise<Task> {
  return db().insert("tasks", {
    id: newId("tsk"),
    tenantId: tenant.id,
    contactId,
    title,
    detail,
    urgent,
    status: "open",
    dueAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
}

export function formatWhen(tenant: Tenant, iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tenant.settings.timezone || "America/Detroit",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function render(text: string, tenant: Tenant, contact: Contact, appointment?: Appointment | null): string {
  const s = tenant.settings;
  const vars: Record<string, string> = {
    first_name: contact.firstName || "there",
    last_name: contact.lastName,
    business: tenant.name,
    booking_url: s.bookingUrl,
    review_url: s.reviewUrl,
    phone: s.phone,
    owner_name: s.ownerName || tenant.name,
    interest: contact.interest,
    interest_clause: contact.interest ? ` about ${contact.interest}` : "",
    services: tenant.services.slice(0, 3).join(", ").toLowerCase() || "their projects",
    appointment_time: appointment ? formatWhen(tenant, appointment.startsAt) : "at your scheduled time",
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "").replace(/[ \t]+\n/g, "\n");
}

// ── Sending ──────────────────────────────────────────────────────────────────

export interface Outgoing {
  channel: Channel;
  subject?: string;
  body: string;
  agent: string;
  summary: string;
  sequenceKey?: string;
}

async function deliver(tenant: Tenant, contact: Contact, channel: Channel, subject: string, body: string) {
  if (channel === "sms") return sendSms(tenant, contact.phone, body);
  if (channel === "email") return sendEmail(tenant, contact.email, subject, body);
  return placeAgentCall(tenant, contact.phone, { first_name: contact.firstName, script: body });
}

const OUT_TYPE = { sms: "sms_out", email: "email_out", call: "call_out" } as const;

/**
 * Sends one message, after the Compliance Guard clears it. With autopilot off
 * the message waits for the owner's approval instead (pass force to send now).
 */
export async function dispatch(tenant: Tenant, contact: Contact, msg: Outgoing, force = false): Promise<Activity> {
  const base = {
    tenantId: tenant.id,
    contactId: contact.id,
    type: OUT_TYPE[msg.channel],
    agent: msg.agent,
    body: msg.body,
    subject: msg.channel === "email" ? (msg.subject ?? "") : "",
    sequenceKey: msg.sequenceKey ?? "",
  };
  const clearance = canContact(contact, msg.channel);
  if (!clearance.ok) {
    return logActivity({ ...base, status: "skipped", agent: "compliance", summary: `${msg.summary} — held back: ${clearance.reason.toLowerCase()}` });
  }
  if (!tenant.settings.autopilot && !force) {
    return logActivity({ ...base, status: "pending_approval", summary: `${msg.summary} — waiting for your OK` });
  }
  const result = await deliver(tenant, contact, msg.channel, msg.subject ?? "", msg.body);
  const activity = await logActivity({
    ...base,
    status: result.status,
    summary: result.status === "failed" ? `${msg.summary} — failed to send` : msg.summary,
    meta: { externalId: result.externalId, error: result.error },
  });
  if (result.status !== "failed") await afterOutbound(tenant, contact);
  return activity;
}

async function afterOutbound(tenant: Tenant, contact: Contact) {
  const patch: Partial<Contact> = { lastOutboundAt: new Date().toISOString() };
  if (contact.stage === "new") {
    patch.stage = "contacted";
    await logActivity({ tenantId: tenant.id, contactId: contact.id, type: "stage_change", agent: "concierge", summary: "Moved to Contacted" });
  }
  Object.assign(contact, patch);
  await db().update("contacts", contact.id, patch);
}

/** Owner approves a message that was waiting in the queue. */
export async function approveMessage(activityId: string): Promise<void> {
  const activity = await db().get("activities", activityId);
  if (!activity || activity.status !== "pending_approval") return;
  const [tenant, contact] = await Promise.all([db().get("tenants", activity.tenantId), db().get("contacts", activity.contactId)]);
  if (!tenant || !contact) return;
  const channel: Channel = activity.type === "email_out" ? "email" : activity.type === "call_out" ? "call" : "sms";
  const clearance = canContact(contact, channel);
  if (!clearance.ok) {
    await db().update("activities", activity.id, { status: "skipped", summary: `Held back: ${clearance.reason.toLowerCase()}` });
    return;
  }
  const result = await deliver(tenant, contact, channel, activity.subject, activity.body);
  await db().update("activities", activity.id, {
    status: result.status,
    summary: activity.summary.replace(" — waiting for your OK", ""),
    meta: { ...activity.meta, externalId: result.externalId, error: result.error, approvedAt: new Date().toISOString() },
  });
  if (result.status !== "failed") await afterOutbound(tenant, contact);
}

export async function rejectMessage(activityId: string): Promise<void> {
  const activity = await db().get("activities", activityId);
  if (!activity || activity.status !== "pending_approval") return;
  await db().update("activities", activityId, { status: "skipped", summary: `${activity.summary.replace(" — waiting for your OK", "")} — you chose not to send` });
}

// ── Sequences ────────────────────────────────────────────────────────────────

async function getSequence(tenantId: string, key: SequenceTrigger): Promise<Sequence | null> {
  const [seq] = await db().list("sequences", { tenantId, key } as Partial<Sequence>);
  return seq ?? null;
}

function runAt(step: SequenceStep, baseMs: number, appointment: Appointment | null): number {
  if (step.anchor === "appointment" && appointment) return new Date(appointment.startsAt).getTime() + step.delayMinutes * MINUTE;
  return baseMs + step.delayMinutes * MINUTE;
}

export async function stopEnrollments(contactId: string, reason: string, only?: (seq: SequenceTrigger) => boolean) {
  const active = await db().list("enrollments", { contactId, status: "active" } as Partial<Enrollment>);
  for (const e of active) {
    if (only && !only(e.sequenceKey)) continue;
    await db().update("enrollments", e.id, { status: "stopped", stoppedReason: reason });
  }
}

export async function enroll(
  tenant: Tenant,
  contact: Contact,
  key: SequenceTrigger,
  appointment: Appointment | null = null,
): Promise<Enrollment | null> {
  const seq = await getSequence(tenant.id, key);
  if (!seq || !seq.active || seq.steps.length === 0 || contact.optedOut) return null;
  await stopEnrollments(contact.id, "Restarted", (k) => k === key);
  const enrollment = await db().insert("enrollments", {
    id: newId("enr"),
    tenantId: tenant.id,
    contactId: contact.id,
    sequenceKey: key,
    stepIndex: 0,
    nextRunAt: new Date(runAt(seq.steps[0], Date.now(), appointment)).toISOString(),
    status: "active",
    stoppedReason: "",
    appointmentId: appointment?.id ?? "",
    createdAt: new Date().toISOString(),
  });
  await runEnrollment(enrollment, new Date());
  return enrollment;
}

/** Runs every step of one enrollment that is due. */
export async function runEnrollment(enrollment: Enrollment, now: Date): Promise<number> {
  let sent = 0;
  const e = enrollment;
  const [tenant, contact, seq] = await Promise.all([
    db().get("tenants", e.tenantId),
    db().get("contacts", e.contactId),
    getSequence(e.tenantId, e.sequenceKey),
  ]);
  const finish = (status: Enrollment["status"], reason: string) =>
    db().update("enrollments", e.id, { status, stoppedReason: reason, stepIndex: e.stepIndex });
  if (!tenant || !contact || !seq) {
    await finish("stopped", "Missing record");
    return 0;
  }
  if (contact.optedOut) {
    await finish("stopped", "Opted out");
    return 0;
  }
  if (!seq.active || tenant.status === "paused") return 0;
  const appointment = e.appointmentId ? await db().get("appointments", e.appointmentId) : null;
  const templates = await db().list("templates", { tenantId: tenant.id });

  for (let guard = 0; guard < 12 && e.status === "active"; guard++) {
    if (new Date(e.nextRunAt).getTime() > now.getTime()) break;
    const step = seq.steps[e.stepIndex];
    if (!step) break;

    let skip = false;
    if (step.anchor === "appointment") {
      if (!appointment || !["scheduled", "confirmed"].includes(appointment.status)) {
        await finish("stopped", "Appointment no longer active");
        return sent;
      }
      // A reminder whose moment has passed (booked on short notice) is skipped, not sent late.
      if (now.getTime() - new Date(e.nextRunAt).getTime() > 60 * MINUTE) skip = true;
    }
    // Sending hours apply to scheduled follow-ups. A reply to something the
    // person did moments ago (filled in the form, called, booked) goes out at
    // any hour, because that is when they are expecting it.
    const immediate = !step.anchor && step.delayMinutes <= 5 && now.getTime() - new Date(e.createdAt).getTime() < 10 * MINUTE;
    if (!skip && !immediate && step.channel !== "email" && !insideSendingHours(tenant, now)) {
      e.nextRunAt = nextSendingTime(tenant, now).toISOString();
      break;
    }
    if (!skip) {
      const tpl = templates.find((t) => t.key === step.templateKey);
      if (tpl) {
        const activity = await dispatch(tenant, contact, {
          channel: step.channel,
          subject: render(tpl.subject, tenant, contact, appointment),
          body: render(tpl.body, tenant, contact, appointment),
          agent: agentFor(seq.key),
          summary: tpl.name,
          sequenceKey: seq.key,
        });
        if (activity.status !== "skipped") sent++;
      }
    }

    // Advance to the next step.
    let nextIndex = e.stepIndex + 1;
    if (nextIndex >= seq.steps.length) {
      if (seq.loopFromStep !== null && seq.steps[seq.loopFromStep]) {
        nextIndex = seq.loopFromStep;
      } else {
        e.status = "completed";
        e.stepIndex = nextIndex;
        await db().update("enrollments", e.id, { status: "completed", stepIndex: nextIndex });
        // No reply after the whole sequence: move to the long-term drip.
        if (seq.thenStart === "nurture" && ["new", "contacted", "engaged"].includes(contact.stage)) {
          await setStage(tenant, contact, "nurture", "nurture");
        }
        return sent;
      }
    }
    e.stepIndex = nextIndex;
    e.nextRunAt = new Date(runAt(seq.steps[nextIndex], now.getTime(), appointment)).toISOString();
  }
  if (e.status === "active") await db().update("enrollments", e.id, { stepIndex: e.stepIndex, nextRunAt: e.nextRunAt });
  return sent;
}

function agentFor(key: SequenceTrigger): string {
  if (key === "appointment" || key === "no_show") return "scheduler";
  if (key === "review") return "reputation";
  if (key === "nurture" || key === "reactivation") return "nurture";
  return "concierge";
}

/** The heartbeat. Call every few minutes from a scheduler (see /api/cron/tick). */
export async function tick(now = new Date()): Promise<{ checked: number; ran: number; sent: number }> {
  const active = await db().list("enrollments", { status: "active" } as Partial<Enrollment>);
  const due = active.filter((e) => new Date(e.nextRunAt).getTime() <= now.getTime());
  let sent = 0;
  for (const e of due) sent += await runEnrollment(e, now);
  return { checked: active.length, ran: due.length, sent };
}

// ── Stage changes ────────────────────────────────────────────────────────────

export async function setStage(tenant: Tenant, contact: Contact, stage: StageId, agent = "owner"): Promise<void> {
  if (contact.stage === stage) return;
  contact.stage = stage;
  await db().update("contacts", contact.id, { stage });
  await logActivity({ tenantId: tenant.id, contactId: contact.id, type: "stage_change", agent, summary: `Moved to ${stageLabel(stage)}` });

  if (stage === "won") {
    await stopEnrollments(contact.id, "Became a customer", (k) => k !== "appointment");
    if (hasFeature(tenant, "review_requests") && tenant.settings.reviewUrl) {
      await db().insert("reviews", {
        id: newId("rev"),
        tenantId: tenant.id,
        contactId: contact.id,
        platform: "Google",
        rating: 0,
        text: "",
        status: "requested",
        response: "",
        createdAt: new Date().toISOString(),
      });
      await enroll(tenant, contact, "review");
    }
  } else if (stage === "nurture") {
    await stopEnrollments(contact.id, "Moved to nurture", (k) => k !== "nurture");
    if (hasFeature(tenant, "nurture_drip")) await enroll(tenant, contact, "nurture");
  } else if (stage === "lost") {
    await stopEnrollments(contact.id, "Closed");
  }
}

// ── A lead arrives ───────────────────────────────────────────────────────────

export interface LeadInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  interest?: string;
  message?: string;
  source?: LeadSource;
  smsConsent?: boolean;
}

export async function findContact(tenantId: string, phone: string, email: string): Promise<Contact | null> {
  const all = await db().list("contacts", { tenantId });
  return (
    (phone && all.find((c) => c.phone === phone)) ||
    (email && all.find((c) => c.email && c.email.toLowerCase() === email.toLowerCase())) ||
    null
  );
}

export async function ingestLead(tenant: Tenant, input: LeadInput): Promise<Contact> {
  const phone = normalizePhone(input.phone ?? "");
  const email = (input.email ?? "").trim();
  const source = input.source ?? "web_form";
  let contact = await findContact(tenant.id, phone, email);
  const returning = Boolean(contact);

  if (contact) {
    const patch: Partial<Contact> = {
      firstName: contact.firstName || input.firstName?.trim() || "",
      lastName: contact.lastName || input.lastName?.trim() || "",
      email: contact.email || email,
      phone: contact.phone || phone,
      interest: input.interest?.trim() || contact.interest,
      smsConsent: contact.smsConsent || Boolean(input.smsConsent),
      emailConsent: contact.emailConsent || Boolean(email),
    };
    Object.assign(contact, patch);
    await db().update("contacts", contact.id, patch);
  } else {
    contact = await db().insert("contacts", {
      id: newId("con"),
      tenantId: tenant.id,
      firstName: input.firstName?.trim() ?? "",
      lastName: input.lastName?.trim() ?? "",
      email,
      phone,
      source,
      stage: "new",
      interest: input.interest?.trim() ?? "",
      tags: [],
      smsConsent: Boolean(input.smsConsent) && Boolean(phone),
      emailConsent: Boolean(email),
      optedOut: false,
      urgent: false,
      score: 50,
      value: 0,
      owner: tenant.settings.ownerName,
      createdAt: new Date().toISOString(),
      lastOutboundAt: null,
      lastInboundAt: null,
    });
  }

  await logActivity({
    tenantId: tenant.id,
    contactId: contact.id,
    type: "lead_created",
    agent: "concierge",
    summary: returning ? "Reached out again" : `New lead from ${SOURCE_LABEL[source]}${contact.interest ? `: ${contact.interest}` : ""}`,
    body: input.message ?? "",
  });

  const q = await qualifyLead(tenant, contact, input.message ?? "");
  const scored: Partial<Contact> = { score: q.score, urgent: q.urgent, value: q.estimatedValue || contact.value };
  Object.assign(contact, scored);
  await db().update("contacts", contact.id, scored);
  if (q.urgent) await addTask(tenant, contact.id, `Urgent: call ${fullName(contact)}`, q.summary, true);

  if (contact.optedOut) return contact;
  if (returning && ["nurture", "lost", "won"].includes(contact.stage)) await setStage(tenant, contact, "engaged", "concierge");

  const reachable = canContact(contact, "sms").ok || canContact(contact, "email").ok;
  if (!reachable) {
    // The Feed Jackson rule: no way to message them, so they go on the call list.
    await addTask(tenant, contact.id, `Call ${fullName(contact)}`, "No email on file and no permission to text, so the system can't follow up automatically.");
  } else {
    await enroll(tenant, contact, "new_lead");
  }
  return contact;
}

// ── A message comes in ───────────────────────────────────────────────────────

export async function handleInbound(
  tenant: Tenant,
  input: { phone?: string; email?: string; body: string; channel: "sms" | "email" },
): Promise<{ contact: Contact; reply: string }> {
  const phone = normalizePhone(input.phone ?? "");
  const email = (input.email ?? "").trim();
  const body = input.body.trim();
  let contact = await findContact(tenant.id, phone, email);
  if (!contact) {
    contact = await db().insert("contacts", {
      id: newId("con"),
      tenantId: tenant.id,
      firstName: "",
      lastName: "",
      email,
      phone,
      source: input.channel === "sms" ? "sms" : "web_form",
      stage: "new",
      interest: "",
      tags: [],
      // They wrote to the business first, so replying on the same channel is expected.
      smsConsent: input.channel === "sms",
      emailConsent: Boolean(email),
      optedOut: false,
      urgent: false,
      score: 55,
      value: 0,
      owner: tenant.settings.ownerName,
      createdAt: new Date().toISOString(),
      lastOutboundAt: null,
      lastInboundAt: null,
    });
  }
  const inType = input.channel === "sms" ? "sms_in" : "email_in";
  const log = (summary: string, agent = "closer") =>
    logActivity({ tenantId: tenant.id, contactId: contact!.id, type: inType, status: "received", agent, summary, body });

  if (isOptOut(body)) {
    await log("Asked to stop — opted out", "compliance");
    await db().update("contacts", contact.id, { optedOut: true, smsConsent: false });
    contact.optedOut = true;
    await setStage(tenant, contact, "lost", "compliance");
    await stopEnrollments(contact.id, "Opted out");
    return { contact, reply: "" };
  }
  if (isOptIn(body)) {
    await log("Opted back in", "compliance");
    await db().update("contacts", contact.id, { optedOut: false, smsConsent: true });
    return { contact, reply: "" };
  }

  const patch: Partial<Contact> = { lastInboundAt: new Date().toISOString() };
  if (input.channel === "sms" && !contact.smsConsent) patch.smsConsent = true;
  Object.assign(contact, patch);
  await db().update("contacts", contact.id, patch);

  // One-letter appointment answers, like the Confirm / Switch buttons in the volunteer email.
  const upcoming = (await db().list("appointments", { contactId: contact.id } as Partial<Appointment>)).find(
    (a) => ["scheduled", "confirmed"].includes(a.status) && new Date(a.startsAt).getTime() > Date.now(),
  );
  const word = body.toLowerCase().replace(/[^a-z]/g, "");
  if (upcoming && ["c", "confirm", "confirmed", "yes", "y"].includes(word)) {
    await log("Confirmed their appointment", "scheduler");
    await db().update("appointments", upcoming.id, { status: "confirmed" });
    const reply = `Thank you${contact.firstName ? `, ${contact.firstName}` : ""}! You're confirmed for ${formatWhen(tenant, upcoming.startsAt)}.`;
    await dispatch(tenant, contact, { channel: input.channel, body: reply, subject: "You're confirmed", agent: "scheduler", summary: "Confirmation reply" }, true);
    return { contact, reply };
  }
  if (upcoming && ["r", "reschedule"].includes(word)) {
    await log("Asked to reschedule", "scheduler");
    await addTask(tenant, contact.id, `Reschedule ${fullName(contact)}`, `They asked to move their ${formatWhen(tenant, upcoming.startsAt)} appointment.`);
    const reply = `No problem. Pick a new time here: ${tenant.settings.bookingUrl}`;
    await dispatch(tenant, contact, { channel: input.channel, body: reply, subject: "Pick a new time", agent: "scheduler", summary: "Reschedule link" }, true);
    return { contact, reply };
  }

  await log(input.channel === "sms" ? "Replied by text" : "Replied by email");
  const sequences = await db().list("sequences", { tenantId: tenant.id });
  await stopEnrollments(contact.id, "They replied", (k) => sequences.find((s) => s.key === k)?.stopOnReply ?? true);
  if (["new", "contacted", "nurture"].includes(contact.stage)) await setStage(tenant, contact, "engaged", "closer");

  if (!hasFeature(tenant, "ai_replies")) {
    await addTask(tenant, contact.id, `Reply to ${fullName(contact)}`, `They wrote: "${body.slice(0, 200)}"`);
    return { contact, reply: "" };
  }

  const history = (await db().list("activities", { contactId: contact.id } as Partial<Activity>))
    .filter((a) => ["sms_in", "sms_out", "email_in", "email_out"].includes(a.type) && a.body && a.status !== "skipped")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, -1)
    .map((a) => ({ from: a.type.endsWith("_in") ? ("customer" as const) : ("business" as const), text: a.body }));
  const draft = await draftReply(tenant, contact, history, body, input.channel);
  await dispatch(tenant, contact, { channel: input.channel, subject: `Re: your message to ${tenant.name}`, body: draft.reply, agent: "closer", summary: "AI reply" });
  if (draft.needsHuman || draft.intent === "complaint") {
    await addTask(tenant, contact.id, `Follow up with ${fullName(contact)}`, draft.reasonForHuman || `They wrote: "${body.slice(0, 200)}"`, draft.intent === "complaint");
  }
  if (draft.intent === "not_now") await setStage(tenant, contact, "nurture", "closer");
  if (draft.intent === "not_interested") await setStage(tenant, contact, "lost", "closer");
  return { contact, reply: draft.reply };
}

// ── Calls ────────────────────────────────────────────────────────────────────

export async function handleMissedCall(tenant: Tenant, fromPhone: string): Promise<Contact | null> {
  const phone = normalizePhone(fromPhone);
  if (!phone) return null;
  let contact = await findContact(tenant.id, phone, "");
  if (!contact) {
    contact = await db().insert("contacts", {
      id: newId("con"),
      tenantId: tenant.id,
      firstName: "",
      lastName: "",
      email: "",
      phone,
      source: "missed_call",
      stage: "new",
      interest: "",
      // Texting back a number that just called the business is a direct reply to their inquiry.
      tags: ["called-first"],
      smsConsent: true,
      emailConsent: false,
      optedOut: false,
      urgent: false,
      score: 60,
      value: 0,
      owner: tenant.settings.ownerName,
      createdAt: new Date().toISOString(),
      lastOutboundAt: null,
      lastInboundAt: null,
    });
  }
  await logActivity({ tenantId: tenant.id, contactId: contact.id, type: "missed_call", agent: "receptionist", summary: "Missed call" });
  if (hasFeature(tenant, "missed_call_textback")) await enroll(tenant, contact, "missed_call");
  return contact;
}

/** Turns the phone attendant's post-call report into a contact, a log entry and tasks. */
export async function handleCallReport(
  tenant: Tenant,
  report: {
    callerPhone: string;
    conversationId: string;
    summary: string;
    durationSeconds: number;
    fields: Record<string, string | number | boolean | null | undefined>;
  },
): Promise<Contact> {
  const f = report.fields;
  const str = (k: string) => (typeof f[k] === "string" ? (f[k] as string).trim() : "");
  const yes = (k: string) => f[k] === true || f[k] === "true";
  const phone = normalizePhone(str("callback_number")) || normalizePhone(report.callerPhone);
  const [firstName, ...rest] = str("caller_name").split(/\s+/).filter(Boolean);
  let contact = await findContact(tenant.id, phone, str("caller_email"));
  const isNew = !contact;
  if (!contact) {
    contact = await db().insert("contacts", {
      id: newId("con"),
      tenantId: tenant.id,
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      email: str("caller_email"),
      phone,
      source: "phone",
      stage: "new",
      interest: str("service_interest") || str("reason_for_call"),
      tags: str("category") ? [str("category")] : [],
      smsConsent: yes("sms_consent"),
      emailConsent: Boolean(str("caller_email")),
      optedOut: false,
      urgent: yes("urgent"),
      score: 60,
      value: 0,
      owner: tenant.settings.ownerName,
      createdAt: new Date().toISOString(),
      lastOutboundAt: null,
      lastInboundAt: null,
    });
  } else {
    const patch: Partial<Contact> = {
      firstName: contact.firstName || firstName || "",
      lastName: contact.lastName || rest.join(" "),
      email: contact.email || str("caller_email"),
      smsConsent: contact.smsConsent || yes("sms_consent"),
      urgent: contact.urgent || yes("urgent"),
      lastInboundAt: new Date().toISOString(),
    };
    Object.assign(contact, patch);
    await db().update("contacts", contact.id, patch);
  }
  await logActivity({
    tenantId: tenant.id,
    contactId: contact.id,
    type: "call_in",
    status: "received",
    agent: "receptionist",
    summary: str("reason_for_call") || "Phone call answered by the AI attendant",
    body: [report.summary, str("message") && `Message: ${str("message")}`].filter(Boolean).join("\n\n"),
    meta: { conversationId: report.conversationId, durationSeconds: report.durationSeconds, category: str("category"), preferredTime: str("preferred_time") },
  });

  if (yes("opt_out_requested")) {
    await db().update("contacts", contact.id, { optedOut: true, smsConsent: false });
    contact.optedOut = true;
    await setStage(tenant, contact, "lost", "compliance");
    return contact;
  }
  const followUp = str("follow_up_needed");
  if (yes("urgent")) await addTask(tenant, contact.id, `Urgent: call ${fullName(contact)}`, followUp || report.summary, true);
  else if (yes("callback_requested") || (followUp && followUp.toLowerCase() !== "none")) {
    await addTask(tenant, contact.id, `Call back ${fullName(contact)}`, followUp || str("message") || report.summary);
  }
  if (yes("appointment_requested") && !yes("urgent")) {
    await addTask(tenant, contact.id, `Book ${fullName(contact)}`, `Asked for an appointment${str("preferred_time") ? `: ${str("preferred_time")}` : ""}.`);
  }
  const reachable = canContact(contact, "sms").ok || canContact(contact, "email").ok;
  if (isNew && reachable && ["new_customer", "appointment", "question", ""].includes(str("category"))) {
    await enroll(tenant, contact, "new_lead");
  }
  if (!isNew && ["nurture", "contacted", "new"].includes(contact.stage)) await setStage(tenant, contact, "engaged", "receptionist");
  return contact;
}

// ── Appointments ─────────────────────────────────────────────────────────────

export async function bookAppointment(
  tenant: Tenant,
  contact: Contact,
  input: { title: string; startsAt: string; durationMinutes?: number; location?: string; bookedBy?: string },
): Promise<Appointment> {
  const appointment = await db().insert("appointments", {
    id: newId("apt"),
    tenantId: tenant.id,
    contactId: contact.id,
    title: input.title || contact.interest || "Appointment",
    startsAt: new Date(input.startsAt).toISOString(),
    durationMinutes: input.durationMinutes ?? 60,
    location: input.location ?? "",
    status: "scheduled",
    bookedBy: input.bookedBy ?? "owner",
    createdAt: new Date().toISOString(),
  });
  await logActivity({
    tenantId: tenant.id,
    contactId: contact.id,
    type: "appointment",
    agent: appointment.bookedBy,
    summary: `Booked: ${appointment.title} — ${formatWhen(tenant, appointment.startsAt)}`,
  });
  await stopEnrollments(contact.id, "Booked an appointment");
  if (!["won"].includes(contact.stage)) await setStage(tenant, contact, "booked", "scheduler");
  await enroll(tenant, contact, "appointment", appointment);
  return appointment;
}

export async function setAppointmentStatus(tenant: Tenant, appointmentId: string, status: Appointment["status"]): Promise<void> {
  const appointment = await db().get("appointments", appointmentId);
  if (!appointment) return;
  await db().update("appointments", appointmentId, { status });
  const contact = await db().get("contacts", appointment.contactId);
  if (!contact) return;
  const label = { completed: "Appointment completed", no_show: "Did not show", cancelled: "Appointment cancelled", confirmed: "Appointment confirmed", scheduled: "Appointment rescheduled" }[status];
  await logActivity({ tenantId: tenant.id, contactId: contact.id, type: "appointment", agent: "scheduler", summary: label });
  if (status === "no_show" || status === "cancelled") {
    await stopEnrollments(contact.id, label, (k) => k === "appointment");
    if (contact.stage === "booked") await setStage(tenant, contact, "engaged", "scheduler");
    if (status === "no_show" && hasFeature(tenant, "no_show_recovery")) await enroll(tenant, contact, "no_show");
  }
}

// ── Win-back ─────────────────────────────────────────────────────────────────

/** Enrolls past customers who have not heard from the business in 60 days. */
export async function startReactivation(tenant: Tenant): Promise<number> {
  if (!hasFeature(tenant, "reactivation")) return 0;
  const cutoff = Date.now() - 60 * 24 * 60 * MINUTE;
  const [contacts, active] = await Promise.all([
    db().list("contacts", { tenantId: tenant.id }),
    db().list("enrollments", { tenantId: tenant.id, status: "active" } as Partial<Enrollment>),
  ]);
  const busy = new Set(active.map((e) => e.contactId));
  let count = 0;
  for (const c of contacts) {
    const last = Math.max(new Date(c.lastOutboundAt ?? c.createdAt).getTime(), new Date(c.lastInboundAt ?? c.createdAt).getTime());
    if (c.stage !== "won" || c.optedOut || busy.has(c.id) || last > cutoff) continue;
    if (await enroll(tenant, c, "reactivation")) count++;
  }
  return count;
}
