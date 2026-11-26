import type { Channel, Contact, Tenant } from "./types";

// The Compliance Guard. Plain rules, no AI, no override.

const STOP_WORDS = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit", "opt out", "optout", "remove me"];
const START_WORDS = ["start", "unstop", "subscribe"];

export function isOptOut(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!]/g, "");
  return STOP_WORDS.includes(t) || /\b(stop (texting|messaging|calling|contacting)|do not (text|call|contact)|don't (text|call|contact) me)\b/.test(t);
}

export function isOptIn(text: string): boolean {
  return START_WORDS.includes(text.trim().toLowerCase());
}

export function localHour(tenant: Tenant, at: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: tenant.settings.timezone || "America/Detroit",
    hour: "numeric",
    hourCycle: "h23",
  }).format(at);
  return Number(hour);
}

/** Texts and calls only go out inside the business's sending hours. */
export function insideSendingHours(tenant: Tenant, at: Date): boolean {
  const h = localHour(tenant, at);
  return h >= tenant.settings.quietStartHour && h < tenant.settings.quietEndHour;
}

/** The next moment sending is allowed, at or after `at`. */
export function nextSendingTime(tenant: Tenant, at: Date): Date {
  if (insideSendingHours(tenant, at)) return at;
  const next = new Date(at);
  next.setMinutes(0, 0, 0);
  for (let i = 0; i < 48; i++) {
    next.setTime(next.getTime() + 60 * 60 * 1000);
    if (insideSendingHours(tenant, next)) return next;
  }
  return next;
}

export interface Clearance {
  ok: boolean;
  reason: string;
}

export function canContact(contact: Contact, channel: Channel): Clearance {
  if (contact.optedOut) return { ok: false, reason: "Opted out" };
  if (channel === "email") {
    if (!contact.email) return { ok: false, reason: "No email on file" };
    if (!contact.emailConsent) return { ok: false, reason: "Unsubscribed from email" };
    return { ok: true, reason: "" };
  }
  if (!contact.phone) return { ok: false, reason: "No phone on file" };
  if (channel === "sms" && !contact.smsConsent) return { ok: false, reason: "No permission to text" };
  return { ok: true, reason: "" };
}

export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 8) return `+${digits}`;
  return "";
}

export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const ten = d.length === 11 ? d.slice(1) : d;
  if (ten.length !== 10) return e164;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** Turns a wall-clock value from a datetime-local input ("2026-12-03T14:30") in the business's time zone into a UTC timestamp. */
export function localInputToIso(value: string, timeZone: string): string {
  const asUtc = new Date(`${value.slice(0, 16)}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return "";
  const shown = new Date(`${isoToLocalInput(asUtc.toISOString(), timeZone)}:00Z`);
  return new Date(asUtc.getTime() - (shown.getTime() - asUtc.getTime())).toISOString();
}

/** The reverse: a UTC timestamp as a datetime-local value in the business's time zone. */
export function isoToLocalInput(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
