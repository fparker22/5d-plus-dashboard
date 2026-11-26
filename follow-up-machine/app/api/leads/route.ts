import { ingestLead } from "@/lib/engine";
import { tenantBySlug } from "@/lib/tenant";

// Public lead intake. Point any website form, landing page or ad platform here:
//   POST /api/leads   { tenant: "business-slug", firstName, lastName, email, phone, interest, message, smsConsent }
// Accepts JSON or a regular HTML form post.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) body = await request.json();
    else (await request.formData()).forEach((v, k) => (body[k] = typeof v === "string" ? v : ""));
  } catch {
    return Response.json({ error: "The request body could not be read." }, { status: 400, headers: cors });
  }
  const text = (k: string) => String(body[k] ?? "").trim().slice(0, 2000);

  // Honeypot: real people never fill a field they cannot see.
  if (text("company_website")) return Response.json({ ok: true }, { headers: cors });

  const tenant = await tenantBySlug(text("tenant") || new URL(request.url).searchParams.get("tenant") || "");
  if (!tenant) return Response.json({ error: "Unknown business. Pass the business slug as `tenant`." }, { status: 404, headers: cors });
  if (!text("email") && !text("phone")) {
    return Response.json({ error: "Add a phone number or an email so the business can reach you." }, { status: 422, headers: cors });
  }
  const consent = body.smsConsent;
  const contact = await ingestLead(tenant, {
    firstName: text("firstName") || text("first_name") || text("name").split(" ")[0],
    lastName: text("lastName") || text("last_name") || text("name").split(" ").slice(1).join(" "),
    email: text("email"),
    phone: text("phone"),
    interest: text("interest") || text("service"),
    message: text("message"),
    source: "web_form",
    smsConsent: consent === true || consent === "on" || consent === "true" || consent === "yes",
  });
  return Response.json({ ok: true, contactId: contact.id }, { headers: cors });
}
