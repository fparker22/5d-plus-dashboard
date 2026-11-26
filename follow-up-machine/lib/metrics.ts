import { db } from "./store";
import { JOURNEY, type Activity, type Appointment, type Contact, type Enrollment, type Review, type StageId, type Task, type Tenant } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export interface Snapshot {
  contacts: Contact[];
  activities: Activity[];
  appointments: Appointment[];
  reviews: Review[];
  tasks: Task[];
  enrollments: Enrollment[];
}

export async function loadSnapshot(tenantId: string): Promise<Snapshot> {
  const [contacts, activities, appointments, reviews, tasks, enrollments] = await Promise.all([
    db().list("contacts", { tenantId }),
    db().list("activities", { tenantId }),
    db().list("appointments", { tenantId }),
    db().list("reviews", { tenantId }),
    db().list("tasks", { tenantId }),
    db().list("enrollments", { tenantId }),
  ]);
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { contacts, activities, appointments, reviews, tasks, enrollments };
}

export interface Metrics {
  stageCounts: Record<StageId, number>;
  /** Contacts that reached each journey station or beyond. */
  reached: number[];
  newThisWeek: number;
  newLastWeek: number;
  medianResponseSeconds: number | null;
  bookedThisWeek: number;
  wonThisMonth: number;
  wonValueThisMonth: number;
  pipelineValue: number;
  replyRate: number;
  handledAutomatically: number;
  messagesThisWeek: number;
  pendingApprovals: number;
  openTasks: number;
  avgRating: number | null;
  reviewCount: number;
  activeSequences: number;
  leadsByDay: { day: string; count: number }[];
}

export function computeMetrics(snap: Snapshot, now = Date.now()): Metrics {
  const { contacts, activities, appointments, reviews, tasks, enrollments } = snap;
  const stageCounts = { new: 0, contacted: 0, engaged: 0, booked: 0, won: 0, nurture: 0, lost: 0 } as Record<StageId, number>;
  contacts.forEach((c) => (stageCounts[c.stage] += 1));

  // "Reached" treats nurture as having been contacted, so the line never under-counts.
  const order = (s: StageId) => (s === "nurture" ? 2 : s === "lost" ? 1 : JOURNEY.indexOf(s));
  const reached = JOURNEY.map((_, i) => contacts.filter((c) => order(c.stage) >= i).length);

  const since = (iso: string) => now - new Date(iso).getTime();
  const newThisWeek = contacts.filter((c) => since(c.createdAt) < 7 * DAY).length;
  const newLastWeek = contacts.filter((c) => since(c.createdAt) >= 7 * DAY && since(c.createdAt) < 14 * DAY).length;

  // Speed to lead: time from a contact's creation to the first outbound message.
  const firstOut = new Map<string, number>();
  for (const a of activities) {
    if (!["sms_out", "email_out", "call_out"].includes(a.type) || !["sent", "simulated"].includes(a.status)) continue;
    const t = new Date(a.createdAt).getTime();
    if (!firstOut.has(a.contactId) || t < firstOut.get(a.contactId)!) firstOut.set(a.contactId, t);
  }
  const gaps = contacts
    .filter((c) => firstOut.has(c.id))
    .map((c) => (firstOut.get(c.id)! - new Date(c.createdAt).getTime()) / 1000)
    .filter((s) => s >= 0)
    .sort((a, b) => a - b);
  const medianResponseSeconds = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;

  const outbound = activities.filter((a) => a.type.endsWith("_out") && ["sent", "simulated"].includes(a.status));
  const contactedIds = new Set(outbound.map((a) => a.contactId));
  const repliedIds = new Set(activities.filter((a) => a.type.endsWith("_in") && a.agent !== "compliance").map((a) => a.contactId));
  const replyRate = contactedIds.size ? [...contactedIds].filter((id) => repliedIds.has(id)).length / contactedIds.size : 0;

  const wonRecently = contacts.filter(
    (c) => c.stage === "won" && activities.some((a) => a.contactId === c.id && a.type === "stage_change" && /won/i.test(a.summary) && since(a.createdAt) < 30 * DAY),
  );
  const rated = reviews.filter((r) => r.rating > 0);

  const leadsByDay = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * DAY);
    const key = start.toISOString().slice(0, 10);
    return { day: key, count: contacts.filter((c) => c.createdAt.slice(0, 10) === key).length };
  });

  return {
    stageCounts,
    reached,
    newThisWeek,
    newLastWeek,
    medianResponseSeconds,
    bookedThisWeek: appointments.filter((a) => since(a.createdAt) < 7 * DAY).length,
    wonThisMonth: wonRecently.length,
    wonValueThisMonth: wonRecently.reduce((sum, c) => sum + c.value, 0),
    pipelineValue: contacts.filter((c) => ["new", "contacted", "engaged", "booked"].includes(c.stage)).reduce((sum, c) => sum + c.value, 0),
    replyRate,
    handledAutomatically: activities.filter((a) => a.agent !== "owner" && since(a.createdAt) < 7 * DAY && a.status !== "pending_approval").length,
    messagesThisWeek: outbound.filter((a) => since(a.createdAt) < 7 * DAY).length,
    pendingApprovals: activities.filter((a) => a.status === "pending_approval").length,
    openTasks: tasks.filter((t) => t.status === "open").length,
    avgRating: rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null,
    reviewCount: rated.length,
    activeSequences: enrollments.filter((e) => e.status === "active").length,
    leadsByDay,
  };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 90) return `${Math.max(1, Math.round(seconds))} sec`;
  if (seconds < 90 * 60) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} hr`;
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  const future = s < 0;
  const a = Math.abs(s);
  const days = Math.round(a / 86400);
  const text = a < 60 ? "a moment" : a < 3600 ? `${Math.round(a / 60)} min` : a < 86400 ? `${Math.round(a / 3600)} hr` : `${days} ${days === 1 ? "day" : "days"}`;
  if (a < 60) return future ? "in a moment" : "just now";
  return future ? `in ${text}` : `${text} ago`;
}

/** Portfolio numbers for the agency view. */
export function agencyRollup(tenants: Tenant[]) {
  const active = tenants.filter((t) => t.status === "active");
  return {
    clients: tenants.length,
    mrr: active.reduce((s, t) => s + t.monthlyPrice, 0),
  };
}
