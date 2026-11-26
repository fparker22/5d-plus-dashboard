import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies that a webhook really came from Twilio. Twilio signs the full public
 * URL plus the sorted form fields with the account's auth token.
 * Set PUBLIC_BASE_URL to the address Twilio calls (behind a proxy the request's
 * own host can differ, which is the usual reason validation fails).
 */
export function validTwilioRequest(request: Request, params: Record<string, string>): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const incoming = new URL(request.url);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const url = base ? `${base}${incoming.pathname}${incoming.search}` : request.url;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function formParams(request: Request): Promise<Record<string, string>> {
  const form = await request.formData();
  const out: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function twiml(inner: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export const say = (text: string) => `<Say>${escapeXml(text)}</Say>`;
export const xml = escapeXml;
