"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession, SESSION_COOKIE, sessionToken } from "./auth";
import { isoToLocalInput, localInputToIso } from "./compliance";
import {
  approveMessage,
  bookAppointment,
  dispatch,
  handleInbound,
  handleMissedCall,
  ingestLead,
  logActivity,
  rejectMessage,
  setAppointmentStatus,
  setStage,
  startReactivation,
  tick,
} from "./engine";
import { getPlan, hasFeature } from "./plans";
import { provisionTenant } from "./provision";
import { draftReviewResponse, planContent } from "./providers/ai";
import { schedulePost } from "./providers/messaging";
import { db, newId } from "./store";
import { currentTenant, TENANT_COOKIE } from "./tenant";
import type { Appointment, Channel, LeadSource, PlanId, StageId, TableName, Tenant } from "./types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

/** Loads a record and confirms it belongs to the business being viewed. */
async function owned<T extends TableName>(table: T, id: string) {
  await requireSession();
  const tenant = await currentTenant();
  const row = await db().get(table, id);
  if (!row || (row as { tenantId?: string }).tenantId !== tenant.id) throw new Error("That record was not found for this business.");
  return { tenant, row };
}

// ── Session ──────────────────────────────────────────────────────────────────

export async function signIn(_: { error: string }, form: FormData): Promise<{ error: string }> {
  const password = str(form, "password");
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) return { error: "That password didn't match. Try again." };
  (await cookies()).set(SESSION_COOKIE, await sessionToken(password), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 14, path: "/" });
  redirect("/app");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

export async function switchTenant(form: FormData) {
  await requireSession();
  (await cookies()).set(TENANT_COOKIE, str(form, "tenantId"), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect(str(form, "next") || "/app");
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function addContact(form: FormData) {
  await requireSession();
  const tenant = await currentTenant();
  const contact = await ingestLead(tenant, {
    firstName: str(form, "firstName"),
    lastName: str(form, "lastName"),
    email: str(form, "email"),
    phone: str(form, "phone"),
    interest: str(form, "interest"),
    source: (str(form, "source") || "walk_in") as LeadSource,
    smsConsent: form.get("smsConsent") === "on",
  });
  refresh();
  redirect(`/app/contacts/${contact.id}`);
}

export async function addNote(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  const body = str(form, "body");
  if (body) await logActivity({ tenantId: tenant.id, contactId: row.id, type: "note", agent: "owner", summary: "Note", body });
  refresh();
}

export async function sendMessage(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  const body = str(form, "body");
  const channel = (str(form, "channel") || "sms") as Channel;
  if (body) {
    // A message the owner writes by hand skips the approval queue but never the Compliance Guard.
    await dispatch(tenant, row, { channel, subject: str(form, "subject") || `A note from ${tenant.name}`, body, agent: "owner", summary: channel === "sms" ? "Text from you" : "Email from you" }, true);
  }
  refresh();
}

export async function moveStage(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  await setStage(tenant, row, str(form, "stage") as StageId, "owner");
  refresh();
}

export async function updateConsent(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  const smsConsent = form.get("smsConsent") === "on";
  await db().update("contacts", row.id, { smsConsent });
  await logActivity({ tenantId: tenant.id, contactId: row.id, type: "note", agent: "owner", summary: smsConsent ? "Recorded permission to text" : "Removed permission to text" });
  refresh();
}

// ── Appointments ─────────────────────────────────────────────────────────────

export async function createAppointment(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  const startsAt = localInputToIso(str(form, "startsAt"), tenant.settings.timezone);
  if (!startsAt) return;
  await bookAppointment(tenant, row, { title: str(form, "title"), startsAt, durationMinutes: Number(str(form, "duration")) || 60, location: str(form, "location"), bookedBy: "owner" });
  refresh();
}

export async function updateAppointment(form: FormData) {
  const { tenant, row } = await owned("appointments", str(form, "appointmentId"));
  await setAppointmentStatus(tenant, row.id, str(form, "status") as Appointment["status"]);
  refresh();
}

// ── Approvals and tasks ──────────────────────────────────────────────────────

export async function approve(form: FormData) {
  const { row } = await owned("activities", str(form, "activityId"));
  await approveMessage(row.id);
  refresh();
}

export async function reject(form: FormData) {
  const { row } = await owned("activities", str(form, "activityId"));
  await rejectMessage(row.id);
  refresh();
}

export async function approveAll() {
  await requireSession();
  const tenant = await currentTenant();
  const pending = (await db().list("activities", { tenantId: tenant.id })).filter((a) => a.status === "pending_approval");
  for (const a of pending) await approveMessage(a.id);
  refresh();
}

export async function completeTask(form: FormData) {
  const { row } = await owned("tasks", str(form, "taskId"));
  await db().update("tasks", row.id, { status: "done" });
  refresh();
}

// ── Automations ──────────────────────────────────────────────────────────────

export async function toggleSequence(form: FormData) {
  const { row } = await owned("sequences", str(form, "sequenceId"));
  await db().update("sequences", row.id, { active: !row.active });
  refresh();
}

export async function saveTemplate(form: FormData) {
  const { row } = await owned("templates", str(form, "templateId"));
  await db().update("templates", row.id, { subject: str(form, "subject"), body: String(form.get("body") ?? "") });
  refresh();
}

export async function runEngine() {
  await requireSession();
  await tick();
  refresh();
}

export async function runReactivation() {
  await requireSession();
  await startReactivation(await currentTenant());
  refresh();
}

/** Demo helpers: play the customer's side so the flow can be shown end to end. */
export async function simulateReply(form: FormData) {
  const { tenant, row } = await owned("contacts", str(form, "contactId"));
  const body = str(form, "body");
  if (body) await handleInbound(tenant, { phone: row.phone, email: row.email, body, channel: row.phone ? "sms" : "email" });
  refresh();
}

export async function simulateMissedCall() {
  await requireSession();
  const tenant = await currentTenant();
  const number = `+1517555${String(Math.floor(1000 + Math.random() * 8999))}`;
  const contact = await handleMissedCall(tenant, number);
  refresh();
  if (contact) redirect(`/app/contacts/${contact.id}`);
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettings(form: FormData) {
  await requireSession();
  const tenant = await currentTenant();
  const s = tenant.settings;
  const settings = {
    ...s,
    ownerName: str(form, "ownerName"),
    ownerEmail: str(form, "ownerEmail"),
    fromName: str(form, "fromName"),
    fromEmail: str(form, "fromEmail"),
    phone: str(form, "phone"),
    forwardPhone: str(form, "forwardPhone"),
    website: str(form, "website"),
    bookingUrl: str(form, "bookingUrl"),
    reviewUrl: str(form, "reviewUrl"),
    timezone: str(form, "timezone") || s.timezone,
    quietStartHour: Number(str(form, "quietStartHour")) || s.quietStartHour,
    quietEndHour: Number(str(form, "quietEndHour")) || s.quietEndHour,
    autopilot: form.get("autopilot") === "on",
    brandColor: str(form, "brandColor") || s.brandColor,
    voiceTone: str(form, "voiceTone"),
    voiceAgentId: str(form, "voiceAgentId"),
    metricoolBlogId: str(form, "metricoolBlogId"),
  };
  await db().update("tenants", tenant.id, {
    name: str(form, "name") || tenant.name,
    industry: str(form, "industry"),
    tagline: str(form, "tagline"),
    knowledgeBase: String(form.get("knowledgeBase") ?? ""),
    services: str(form, "services").split(",").map((x) => x.trim()).filter(Boolean),
    settings,
  });
  refresh();
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function draftResponse(form: FormData) {
  const { tenant, row } = await owned("reviews", str(form, "reviewId"));
  const contact = await db().get("contacts", row.contactId);
  const response = await draftReviewResponse(tenant, contact?.firstName || "there", row.rating, row.text);
  await db().update("reviews", row.id, { response });
  refresh();
}

export async function saveResponse(form: FormData) {
  const { row } = await owned("reviews", str(form, "reviewId"));
  await db().update("reviews", row.id, { response: String(form.get("response") ?? ""), status: "responded" });
  refresh();
}

// ── Marketing ────────────────────────────────────────────────────────────────

export async function generatePosts(form: FormData) {
  await requireSession();
  const tenant = await currentTenant();
  if (!hasFeature(tenant, "social_content")) return;
  const count = Math.min(Math.max(Number(str(form, "count")) || 4, 1), 8);
  const posts = await planContent(tenant, str(form, "brief"), count);
  // Spread the drafts two days apart at 11:30 a.m. in the business's time zone.
  const tz = tenant.settings.timezone;
  for (const [i, p] of posts.entries()) {
    const day = isoToLocalInput(new Date(Date.now() + (i * 2 + 1) * 24 * 60 * 60 * 1000).toISOString(), tz).slice(0, 10);
    const when = new Date(localInputToIso(`${day}T11:30`, tz));
    await db().insert("social_posts", {
      id: newId("pst"),
      tenantId: tenant.id,
      campaign: p.campaign,
      platforms: p.platforms,
      caption: p.caption,
      mediaPrompt: p.mediaPrompt,
      mediaUrl: "",
      scheduledAt: when.toISOString(),
      status: "pending_approval",
      externalId: "",
      createdAt: new Date().toISOString(),
    });
  }
  refresh();
}

export async function savePost(form: FormData) {
  const { tenant, row } = await owned("social_posts", str(form, "postId"));
  const scheduledAt = localInputToIso(str(form, "scheduledAt"), tenant.settings.timezone);
  await db().update("social_posts", row.id, {
    caption: String(form.get("caption") ?? row.caption),
    mediaUrl: str(form, "mediaUrl"),
    scheduledAt: scheduledAt || row.scheduledAt,
  });
  refresh();
}

export async function approvePost(form: FormData) {
  const { tenant, row } = await owned("social_posts", str(form, "postId"));
  const scheduledAt = row.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const platforms = row.platforms.length ? row.platforms : ["facebook", "instagram"];
  const result = await schedulePost(tenant, { caption: row.caption, platforms, scheduledAt, mediaUrl: row.mediaUrl });
  if (result.status === "failed") throw new Error(`The post could not be scheduled: ${result.error}`);
  await db().update("social_posts", row.id, { status: "scheduled", scheduledAt, platforms, externalId: result.externalId });
  refresh();
}

export async function deletePost(form: FormData) {
  const { row } = await owned("social_posts", str(form, "postId"));
  await db().remove("social_posts", row.id);
  refresh();
}

// ── Agency ───────────────────────────────────────────────────────────────────

export async function createTenant(form: FormData) {
  await requireSession();
  const name = str(form, "name");
  if (!name) return;
  const tenant = await provisionTenant({
    name,
    industry: str(form, "industry"),
    plan: (str(form, "plan") || "starter") as PlanId,
    ownerName: str(form, "ownerName"),
    ownerEmail: str(form, "ownerEmail"),
  });
  (await cookies()).set(TENANT_COOKIE, tenant.id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  refresh();
  redirect("/app/settings");
}

export async function updateTenantPlan(form: FormData) {
  await requireSession();
  const tenant = await db().get("tenants", str(form, "tenantId"));
  if (!tenant) return;
  const plan = getPlan(str(form, "plan") as PlanId);
  const status = (str(form, "status") || tenant.status) as Tenant["status"];
  await db().update("tenants", tenant.id, { plan: plan.id, monthlyPrice: plan.monthly, status });
  refresh();
}
