import { handleInbound } from "@/lib/engine";
import { tenantForWebhook } from "@/lib/tenant";
import { formParams, twiml, validTwilioRequest } from "@/lib/twilio";

// Twilio calls this when a customer texts the business number.
// The reply is sent through the API (so it is logged and cleared by the
// Compliance Guard), which is why this returns an empty TwiML response.
export async function POST(request: Request) {
  const params = await formParams(request);
  if (!validTwilioRequest(request, params)) return new Response("Invalid signature", { status: 403 });
  const tenant = await tenantForWebhook(new URL(request.url), params.To);
  if (!tenant) return twiml("");
  if (params.From && params.Body !== undefined) {
    await handleInbound(tenant, { phone: params.From, body: params.Body, channel: "sms" });
  }
  return twiml("");
}
