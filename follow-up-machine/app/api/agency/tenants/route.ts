import { hasValidSecret } from "@/lib/auth";
import { provisionTenant } from "@/lib/provision";
import { db } from "@/lib/store";

// Agency API: list client businesses, or create one with the full starter kit.
// Used by execution/provision_followup_client.py during onboarding.
export async function GET(request: Request) {
  if (!hasValidSecret(request, "AGENCY_API_KEY")) return new Response("Unauthorized", { status: 401 });
  const tenants = await db().list("tenants");
  return Response.json({ tenants: tenants.map(({ id, slug, name, plan, status }) => ({ id, slug, name, plan, status })) });
}

export async function POST(request: Request) {
  if (!hasValidSecret(request, "AGENCY_API_KEY")) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.name) return Response.json({ error: "A business name is required." }, { status: 422 });
  const tenant = await provisionTenant({
    name: String(body.name),
    industry: body.industry,
    plan: body.plan,
    ownerName: body.ownerName,
    ownerEmail: body.ownerEmail,
    phone: body.phone,
    bookingUrl: body.bookingUrl,
    reviewUrl: body.reviewUrl,
    knowledgeBase: body.knowledgeBase,
    services: Array.isArray(body.services) ? body.services.map(String) : [],
  });
  return Response.json({ ok: true, tenant: { id: tenant.id, slug: tenant.slug, leadFormPath: `/f/${tenant.slug}` } }, { status: 201 });
}
