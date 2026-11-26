// Data model for the Follow-Up Machine.
// Every record carries tenantId so one deployment can serve many client businesses.

export type PlanId = "starter" | "growth" | "premium";

export type Channel = "sms" | "email" | "call";

export type StageId =
  | "new"
  | "contacted"
  | "engaged"
  | "booked"
  | "won"
  | "nurture"
  | "lost";

export type LeadSource =
  | "web_form"
  | "phone"
  | "missed_call"
  | "sms"
  | "walk_in"
  | "referral"
  | "social"
  | "import";

export interface TenantSettings {
  timezone: string; // IANA, e.g. "America/Detroit"
  /** Texts and calls only go out inside this window (local hours, 24h). */
  quietStartHour: number; // first hour sending is allowed, e.g. 8
  quietEndHour: number; // hour sending stops, e.g. 20
  /**
   * The approval gate from the Feed Jackson playbook: when off, every outgoing
   * message waits in the approvals queue for the owner's OK.
   */
  autopilot: boolean;
  bookingUrl: string;
  reviewUrl: string;
  website: string;
  fromName: string;
  fromEmail: string;
  /** The business line customers call and text (E.164). */
  phone: string;
  /** Where live calls ring before the system treats them as missed (E.164). */
  forwardPhone: string;
  ownerName: string;
  ownerEmail: string;
  /** ElevenLabs agent that answers this tenant's line, if provisioned. */
  voiceAgentId: string;
  metricoolBlogId: string;
  brandColor: string;
  voiceTone: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry: string;
  plan: PlanId;
  monthlyPrice: number;
  status: "active" | "onboarding" | "paused";
  tagline: string;
  /** Confirmed facts the agents may answer from. Nothing outside this is ever stated. */
  knowledgeBase: string;
  services: string[];
  settings: TenantSettings;
  createdAt: string;
}

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: StageId;
  /** What they asked about, in their words. */
  interest: string;
  tags: string[];
  /** Only a clear yes counts. */
  smsConsent: boolean;
  emailConsent: boolean;
  optedOut: boolean;
  urgent: boolean;
  /** 0–100 lead score from the qualifier. */
  score: number;
  /** Estimated deal value in dollars. */
  value: number;
  owner: string;
  createdAt: string;
  lastOutboundAt: string | null;
  lastInboundAt: string | null;
}

export type ActivityType =
  | "lead_created"
  | "sms_out"
  | "sms_in"
  | "email_out"
  | "email_in"
  | "call_in"
  | "call_out"
  | "missed_call"
  | "stage_change"
  | "appointment"
  | "review"
  | "note"
  | "system";

export type ActivityStatus =
  | "sent" // delivered through a live provider
  | "simulated" // provider keys not configured; logged only
  | "pending_approval" // waiting for the owner's OK
  | "failed"
  | "skipped" // blocked by consent, opt-out or missing contact info
  | "received"
  | "logged";

export interface Activity {
  id: string;
  tenantId: string;
  contactId: string;
  type: ActivityType;
  status: ActivityStatus;
  /** Which agent (or "owner") did this. See lib/agents.ts. */
  agent: string;
  summary: string;
  body: string;
  subject: string;
  /** Sequence that produced this message, if any. */
  sequenceKey: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export type SequenceTrigger =
  | "new_lead"
  | "missed_call"
  | "appointment"
  | "no_show"
  | "review"
  | "nurture"
  | "reactivation";

export interface SequenceStep {
  /** Minutes after the previous step (or relative to the appointment when anchored). */
  delayMinutes: number;
  channel: Channel;
  templateKey: string;
  /** "appointment" steps are timed against the appointment start (negative = before). */
  anchor?: "appointment";
}

export interface Sequence {
  id: string;
  tenantId: string;
  key: SequenceTrigger;
  name: string;
  description: string;
  active: boolean;
  stopOnReply: boolean;
  /** When the last step finishes, loop back to this step index (long-term drip). */
  loopFromStep: number | null;
  /** Sequence to start when this one finishes without a reply. */
  thenStart: SequenceTrigger | null;
  steps: SequenceStep[];
}

export interface Enrollment {
  id: string;
  tenantId: string;
  contactId: string;
  sequenceKey: SequenceTrigger;
  stepIndex: number;
  nextRunAt: string;
  status: "active" | "completed" | "stopped";
  stoppedReason: string;
  appointmentId: string;
  createdAt: string;
}

export interface Template {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  contactId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
  bookedBy: string;
  createdAt: string;
}

export interface Review {
  id: string;
  tenantId: string;
  contactId: string;
  platform: string;
  rating: number; // 0 until received
  text: string;
  status: "requested" | "received" | "responded";
  response: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  tenantId: string;
  campaign: string;
  platforms: string[];
  caption: string;
  /** Prompt handed to the creative agent (Higgsfield) to produce the visual. */
  mediaPrompt: string;
  mediaUrl: string;
  scheduledAt: string | null;
  status: "idea" | "pending_approval" | "scheduled" | "published";
  externalId: string;
  createdAt: string;
}

/** A follow-up a person has to do — the "morning report" line items. */
export interface Task {
  id: string;
  tenantId: string;
  contactId: string;
  title: string;
  detail: string;
  urgent: boolean;
  status: "open" | "done";
  dueAt: string;
  createdAt: string;
}

export interface TableMap {
  tenants: Tenant;
  contacts: Contact;
  activities: Activity;
  sequences: Sequence;
  enrollments: Enrollment;
  templates: Template;
  appointments: Appointment;
  reviews: Review;
  social_posts: SocialPost;
  tasks: Task;
}

export type TableName = keyof TableMap;

export const STAGES: { id: StageId; label: string; hint: string }[] = [
  { id: "new", label: "New", hint: "Just came in" },
  { id: "contacted", label: "Contacted", hint: "We reached out" },
  { id: "engaged", label: "Engaged", hint: "They replied" },
  { id: "booked", label: "Booked", hint: "Appointment set" },
  { id: "won", label: "Won", hint: "Became a customer" },
  { id: "nurture", label: "Nurture", hint: "Not yet — staying in touch" },
  { id: "lost", label: "Closed", hint: "Opted out or not a fit" },
];

export const JOURNEY: StageId[] = ["new", "contacted", "engaged", "booked", "won"];

export function stageLabel(id: StageId): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

export function fullName(c: Pick<Contact, "firstName" | "lastName">): string {
  return `${c.firstName} ${c.lastName}`.trim() || "Unknown caller";
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  web_form: "the website form",
  phone: "a phone call",
  missed_call: "a missed call",
  sms: "a text message",
  walk_in: "a walk-in",
  referral: "a referral",
  social: "social media",
  import: "your existing list",
};
