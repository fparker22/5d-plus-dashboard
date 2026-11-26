import { handleMissedCall } from "@/lib/engine";
import { hasFeature } from "@/lib/plans";
import { tenantForWebhook } from "@/lib/tenant";
import { formParams, say, twiml, validTwilioRequest, xml } from "@/lib/twilio";

// Incoming calls for businesses WITHOUT the AI attendant (Starter plan):
// ring the owner's phone; if nobody picks up, text the caller back.
// Businesses with the AI attendant point their number at ElevenLabs instead,
// and calls arrive through /api/webhooks/elevenlabs.
export async function POST(request: Request) {
  const params = await formParams(request);
  if (!validTwilioRequest(request, params)) return new Response("Invalid signature", { status: 403 });
  const url = new URL(request.url);
  const tenant = await tenantForWebhook(url, params.To);
  if (!tenant) return twiml(say("Sorry, this number is not in service."));

  // Second leg: Twilio reports how the forwarded call ended.
  if (url.searchParams.get("step") === "after") {
    if (params.DialCallStatus === "completed") return twiml("");
    await handleMissedCall(tenant, params.From ?? "");
    const promise = hasFeature(tenant, "missed_call_textback") ? " We'll text you in just a moment." : "";
    return twiml(say(`Thanks for calling ${tenant.name}. We're sorry we missed you.${promise}`));
  }

  const forward = tenant.settings.forwardPhone;
  if (!forward) {
    await handleMissedCall(tenant, params.From ?? "");
    return twiml(say(`Thanks for calling ${tenant.name}. We'll text you in just a moment.`));
  }
  const after = new URL(url);
  after.searchParams.set("step", "after");
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const action = base ? `${base}${after.pathname}${after.search}` : after.toString();
  return twiml(`<Dial timeout="20" action="${xml(action)}" method="POST">${xml(forward)}</Dial>`);
}
