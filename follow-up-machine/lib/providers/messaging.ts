import type { Tenant } from "../types";

// Outbound channels. Each function returns "simulated" when its keys are not
// set (or SEND_MODE is not "live"), so the whole system can be demoed and
// tested without sending anything to a real person.

export interface SendResult {
  status: "sent" | "simulated" | "failed";
  externalId: string;
  error: string;
}

const simulated: SendResult = { status: "simulated", externalId: "", error: "" };

export function isLive(): boolean {
  return process.env.SEND_MODE === "live";
}

export function integrationStatus() {
  return {
    live: isLive(),
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    email: Boolean(process.env.RESEND_API_KEY),
    ai: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    voice: Boolean(process.env.ELEVENLABS_API_KEY),
    social: Boolean(process.env.METRICOOL_USER_TOKEN && process.env.METRICOOL_USER_ID),
    database: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  return `${res.status} ${text.slice(0, 300)}`;
}

export async function sendSms(tenant: Tenant, to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = tenant.settings.phone || process.env.TWILIO_FROM_NUMBER || "";
  if (!isLive() || !sid || !token) return simulated;
  if (!from) return { status: "failed", externalId: "", error: "No sending number set for this business." };
  try {
    const form = new URLSearchParams({ To: to, Body: body });
    // A Messaging Service (A2P 10DLC campaign) takes priority over a bare number.
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
    else form.set("From", from);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    if (!res.ok) return { status: "failed", externalId: "", error: await readError(res) };
    const json = (await res.json()) as { sid?: string };
    return { status: "sent", externalId: json.sid ?? "", error: "" };
  } catch (e) {
    return { status: "failed", externalId: "", error: String(e) };
  }
}

export async function sendEmail(tenant: Tenant, to: string, subject: string, body: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!isLive() || !key) return simulated;
  const fromEmail = tenant.settings.fromEmail || process.env.DEFAULT_FROM_EMAIL || "";
  if (!fromEmail) return { status: "failed", externalId: "", error: "No from-address set for this business." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${tenant.settings.fromName || tenant.name} <${fromEmail}>`,
        to: [to],
        subject,
        text: body,
        reply_to: tenant.settings.ownerEmail || fromEmail,
      }),
    });
    if (!res.ok) return { status: "failed", externalId: "", error: await readError(res) };
    const json = (await res.json()) as { id?: string };
    return { status: "sent", externalId: json.id ?? "", error: "" };
  } catch (e) {
    return { status: "failed", externalId: "", error: String(e) };
  }
}

/** Starts an outbound call from the tenant's ElevenLabs voice agent. */
export async function placeAgentCall(
  tenant: Tenant,
  to: string,
  variables: Record<string, string>,
): Promise<SendResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  if (!isLive() || !key) return simulated;
  if (!tenant.settings.voiceAgentId || !phoneNumberId) {
    return { status: "failed", externalId: "", error: "No voice agent or agent phone number is set up for this business." };
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: tenant.settings.voiceAgentId,
        agent_phone_number_id: phoneNumberId,
        to_number: to,
        conversation_initiation_client_data: { dynamic_variables: variables },
      }),
    });
    if (!res.ok) return { status: "failed", externalId: "", error: await readError(res) };
    const json = (await res.json()) as { conversation_id?: string; callSid?: string };
    return { status: "sent", externalId: json.conversation_id ?? json.callSid ?? "", error: "" };
  } catch (e) {
    return { status: "failed", externalId: "", error: String(e) };
  }
}

/**
 * Schedules a post through Metricool. Not yet exercised against a live
 * Metricool account — confirm the payload against their API docs during the
 * first Premium onboarding.
 */
export async function schedulePost(
  tenant: Tenant,
  post: { caption: string; platforms: string[]; scheduledAt: string; mediaUrl: string },
): Promise<SendResult> {
  const token = process.env.METRICOOL_USER_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = tenant.settings.metricoolBlogId;
  if (!isLive() || !token || !userId) return simulated;
  if (!blogId) return { status: "failed", externalId: "", error: "No Metricool brand is linked to this business." };
  try {
    const res = await fetch(
      `https://app.metricool.com/api/v2/scheduler/posts?blogId=${encodeURIComponent(blogId)}&userId=${encodeURIComponent(userId)}`,
      {
        method: "POST",
        headers: { "X-Mc-Auth": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: post.caption,
          providers: post.platforms.map((network) => ({ network })),
          publicationDate: { dateTime: post.scheduledAt.slice(0, 19), timezone: tenant.settings.timezone },
          media: post.mediaUrl ? [post.mediaUrl] : [],
          autoPublish: true,
          draft: false,
        }),
      },
    );
    if (!res.ok) return { status: "failed", externalId: "", error: await readError(res) };
    const json = (await res.json()) as { data?: { id?: string | number } };
    return { status: "sent", externalId: String(json.data?.id ?? ""), error: "" };
  } catch (e) {
    return { status: "failed", externalId: "", error: String(e) };
  }
}
