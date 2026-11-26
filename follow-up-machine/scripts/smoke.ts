// End-to-end check of the follow-up engine against the in-memory demo data.
// Run:  npx tsx scripts/smoke.ts
import assert from "node:assert/strict";
import { bookAppointment, handleCallReport, handleInbound, handleMissedCall, ingestLead, setAppointmentStatus, setStage, tick } from "../lib/engine";
import { provisionTenant } from "../lib/provision";
import { db } from "../lib/store";
import type { Activity, Enrollment } from "../lib/types";

const acts = async (contactId: string) => (await db().list("activities", { contactId } as Partial<Activity>)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
const enrs = async (contactId: string) => db().list("enrollments", { contactId } as Partial<Enrollment>);
const noon = () => { const d = new Date(); d.setUTCHours(17, 0, 0, 0); return d; }; // midday Eastern

async function main() {
  const real = Date.now;
  const fixed = noon().getTime();
  Date.now = () => fixed; // keep the run inside sending hours regardless of when it executes
  const OrigDate = Date;
  // @ts-expect-error test clock
  globalThis.Date = class extends OrigDate { constructor(...a: unknown[]) { if (a.length) { super(...(a as [number])); } else { super(fixed); } } static now() { return fixed; } };

  const growth = (await db().get("tenants", "tnt_parkside"))!;
  const starter = (await db().get("tenants", "tnt_glow"))!;

  // 1. New lead → instant text + email, moved to Contacted, sequence waiting on day-1 step.
  const lead = await ingestLead(growth, { firstName: "Test", lastName: "Lead", phone: "(517) 555-0001", email: "test@example.com", interest: "furnace not heating", smsConsent: true });
  const a = await acts(lead.id);
  assert.deepEqual(a.filter((x) => x.type.endsWith("_out")).map((x) => x.type).sort(), ["email_out", "sms_out"]);
  assert.equal((await db().get("contacts", lead.id))!.stage, "contacted");
  let e = (await enrs(lead.id)).find((x) => x.sequenceKey === "new_lead")!;
  assert.equal(e.status, "active"); assert.equal(e.stepIndex, 2);
  console.log("ok  new lead acknowledged by text and email, follow-up scheduled");

  // 2. Customer replies → sequence stops, stage Engaged, a reply goes out.
  const r = await handleInbound(growth, { phone: "+15175550001", body: "Yes can someone come out tomorrow?", channel: "sms" });
  assert.ok(r.reply.length > 0);
  assert.equal((await db().get("contacts", lead.id))!.stage, "engaged");
  assert.equal((await db().get("enrollments", e.id))!.status, "stopped");
  console.log("ok  reply stops the sequence and gets an answer:", JSON.stringify(r.reply));

  // 3. Booking → Booked, confirmation sent, reminders anchored to the appointment.
  const start = new OrigDate(fixed + 3 * 86400_000).toISOString();
  const appt = await bookAppointment(growth, (await db().get("contacts", lead.id))!, { title: "Furnace repair", startsAt: start });
  e = (await enrs(lead.id)).find((x) => x.sequenceKey === "appointment" && x.status === "active")!;
  assert.equal(e.stepIndex, 2);
  assert.equal(new OrigDate(e.nextRunAt).getTime(), new OrigDate(start).getTime() - 86400_000);
  console.log("ok  appointment booked, day-before reminder timed against the appointment");

  // 4. "C" confirms the appointment.
  await handleInbound(growth, { phone: "+15175550001", body: "C", channel: "sms" });
  assert.equal((await db().get("appointments", appt.id))!.status, "confirmed");
  console.log("ok  texting C confirms the appointment");

  // 5. No-show → recovery sequence; Won → review request queued.
  await setAppointmentStatus(growth, appt.id, "no_show");
  assert.ok((await enrs(lead.id)).some((x) => x.sequenceKey === "no_show" && x.status === "active"));
  await setStage(growth, (await db().get("contacts", lead.id))!, "won");
  assert.ok((await enrs(lead.id)).some((x) => x.sequenceKey === "review" && x.status === "active"));
  assert.ok(!(await enrs(lead.id)).some((x) => x.sequenceKey === "no_show" && x.status === "active"));
  console.log("ok  no-show starts recovery; marking Won starts the review request");

  // 6. STOP opts out and nothing more is sent.
  await handleInbound(growth, { phone: "+15175550001", body: "STOP", channel: "sms" });
  const c = (await db().get("contacts", lead.id))!;
  assert.equal(c.optedOut, true);
  assert.ok(!(await enrs(lead.id)).some((x) => x.status === "active"));
  console.log("ok  STOP opts the contact out and ends every sequence");

  // 7. No consent + no email → call task instead of a message.
  const landline = await ingestLead(growth, { firstName: "Barbara", lastName: "Landline", phone: "517-555-0002" });
  assert.equal((await acts(landline.id)).filter((x) => x.type.endsWith("_out")).length, 0);
  assert.ok((await db().list("tasks", { contactId: landline.id })).length === 1);
  console.log("ok  lead with no email and no text permission goes on the call list");

  // 8. Approval gate: starter tenant has autopilot off.
  const held = await ingestLead(starter, { firstName: "Held", phone: "517-555-0003", email: "held@example.com", smsConsent: true });
  assert.ok((await acts(held.id)).filter((x) => x.type.endsWith("_out")).every((x) => x.status === "pending_approval"));
  console.log("ok  with autopilot off, messages wait for approval");

  // 9. Missed call → text-back.
  const missed = (await handleMissedCall(growth, "+15175550004"))!;
  assert.ok((await enrs(missed.id)).some((x) => x.sequenceKey === "missed_call"));
  console.log("ok  missed call enrolls the caller in text-back");

  // 10. Phone attendant report → contact, call log, urgent task.
  const caller = await handleCallReport(growth, { callerPhone: "+15175550005", conversationId: "conv_test", summary: "Caller has no heat.", durationSeconds: 95, fields: { caller_name: "Ray Dawson", category: "new_customer", reason_for_call: "No heat since last night", urgent: true, sms_consent: true, follow_up_needed: "Send a tech today" } });
  assert.equal(caller.firstName, "Ray");
  assert.ok((await db().list("tasks", { contactId: caller.id })).some((t) => t.urgent));
  console.log("ok  call report creates the contact, logs the call and flags it urgent");

  // 11. Unanswered lead runs out of steps → moves to Nurture with the drip running.
  const quiet = await ingestLead(growth, { firstName: "Quiet", phone: "517-555-0006", email: "quiet@example.com", smsConsent: true });
  for (let day = 1; day <= 8; day++) await tick(new OrigDate(fixed + day * 86400_000));
  assert.equal((await db().get("contacts", quiet.id))!.stage, "nurture");
  assert.ok((await enrs(quiet.id)).some((x) => x.sequenceKey === "nurture" && x.status === "active"));
  console.log("ok  a lead who never replies ends up on the long-term drip");

  // 12. Quiet hours: a text due at 2 a.m. local is deferred, not sent.
  const night = new OrigDate(fixed + 9 * 86400_000); night.setUTCHours(7, 0, 0, 0); // 2–3 a.m. Eastern
  const late = await ingestLead(growth, { firstName: "Late", phone: "517-555-0007", smsConsent: true });
  const le = (await enrs(late.id)).find((x) => x.sequenceKey === "new_lead")!;
  await db().update("enrollments", le.id, { nextRunAt: night.toISOString() });
  const before = (await acts(late.id)).length;
  await tick(night);
  assert.equal((await acts(late.id)).length, before);
  assert.ok(new OrigDate((await db().get("enrollments", le.id))!.nextRunAt).getTime() > night.getTime());
  console.log("ok  texts due overnight are held until sending hours");

  // 12b. …but a lead who writes in at night still gets the instant acknowledgement.
  const realNow = fixed; const nightMs = night.getTime();
  // @ts-expect-error test clock
  globalThis.Date = class extends OrigDate { constructor(...x: unknown[]) { if (x.length) { super(...(x as [number])); } else { super(nightMs); } } static now() { return nightMs; } };
  const owl = await ingestLead(growth, { firstName: "Owl", phone: "517-555-0008", email: "owl@example.com", smsConsent: true });
  assert.deepEqual((await acts(owl.id)).filter((x) => x.type.endsWith("_out")).map((x) => x.type).sort(), ["email_out", "sms_out"]);
  const oe = (await enrs(owl.id)).find((x) => x.sequenceKey === "new_lead")!;
  await tick(new OrigDate(nightMs + 86400_000)); // next follow-up falls due at night → held
  assert.equal((await acts(owl.id)).filter((x) => x.type === "sms_out").length, 1);
  assert.equal((await db().get("enrollments", oe.id))!.stepIndex, 2);
  // @ts-expect-error test clock
  globalThis.Date = class extends OrigDate { constructor(...x: unknown[]) { if (x.length) { super(...(x as [number])); } else { super(realNow); } } static now() { return realNow; } };
  console.log("ok  a lead who writes in overnight is acknowledged at once; later follow-ups still wait");

  // 13. Provisioning gives a new client the full kit.
  const t = await provisionTenant({ name: "Smoke Test Bakery", plan: "starter" });
  assert.equal((await db().list("sequences", { tenantId: t.id })).length, 7);
  assert.ok((await db().list("templates", { tenantId: t.id })).length > 15);
  console.log("ok  new client is provisioned with 7 sequences and the template library");

  globalThis.Date = OrigDate; Date.now = real;
  console.log("\nAll engine checks passed.");
}
main().catch((err) => { console.error(err); process.exit(1); });
