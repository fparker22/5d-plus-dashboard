import { createHmac, timingSafeEqual } from "node:crypto";
import { handleCallReport } from "@/lib/engine";
import { db } from "@/lib/store";
import { tenantForWebhook } from "@/lib/tenant";

// ElevenLabs post-call webhook. After every call the phone attendant handles,
// ElevenLabs posts the transcript summary and the data it collected
// (lib/agents.ts → CALL_DATA_FIELDS). This is the automatic version of the
// Phone Line Follow-Up Tracker.

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const parts = Object.fromEntries((header ?? "").split(",").map((p) => p.split("=") as [string, string]));
  if (!parts.t || !parts.v0) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
  const a = Buffer.from(parts.v0);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("elevenlabs-signature"))) return new Response("Invalid signature", { status: 403 });
  let payload: Json;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  if (payload.type && payload.type !== "post_call_transcription") return Response.json({ ok: true, ignored: payload.type });

  const data = obj(payload.data);
  const analysis = obj(data.analysis);
  const metadata = obj(data.metadata);
  const phoneCall = obj(metadata.phone_call);

  // Match the business by ?tenant=slug, then by the agent that took the call.
  let tenant = await tenantForWebhook(new URL(request.url), String(phoneCall.agent_number ?? ""));
  if (!tenant && data.agent_id) {
    tenant = (await db().list("tenants")).find((t) => t.settings.voiceAgentId === data.agent_id) ?? null;
  }
  if (!tenant) return Response.json({ error: "No business matches this agent or number." }, { status: 404 });

  const fields: Record<string, string | number | boolean | null> = {};
  for (const [key, result] of Object.entries(obj(analysis.data_collection_results))) {
    const value = obj(result).value;
    fields[key] = typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;
  }
  const contact = await handleCallReport(tenant, {
    callerPhone: String(phoneCall.external_number ?? ""),
    conversationId: String(data.conversation_id ?? ""),
    summary: String(analysis.transcript_summary ?? ""),
    durationSeconds: Number(metadata.call_duration_secs ?? 0),
    fields,
  });
  return Response.json({ ok: true, contactId: contact.id });
}
