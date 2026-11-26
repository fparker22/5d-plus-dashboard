import { hasValidSecret } from "@/lib/auth";
import { normalizePhone } from "@/lib/compliance";
import { bookAppointment, findContact, formatWhen, ingestLead } from "@/lib/engine";
import { hasFeature } from "@/lib/plans";
import { db } from "@/lib/store";
import { tenantBySlug } from "@/lib/tenant";
import { fullName } from "@/lib/types";

// Tools the phone attendant can call in the middle of a conversation.
// Register these as webhook tools on the ElevenLabs agent:
//   POST /api/agent-tools?tenant=<slug>   Authorization: Bearer $AGENT_TOOLS_SECRET
//   { "tool": "lookup_caller", "phone": "+1..." }
//   { "tool": "book_appointment", "phone": "+1...", "name": "...", "startsAt": "2026-12-03T14:30:00-05:00", "reason": "..." }
export async function POST(request: Request) {
  if (!hasValidSecret(request, "AGENT_TOOLS_SECRET")) return new Response("Unauthorized", { status: 401 });
  const tenant = await tenantBySlug(new URL(request.url).searchParams.get("tenant") ?? "");
  if (!tenant) return Response.json({ error: "Unknown business." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone ?? ""));

  if (body.tool === "lookup_caller") {
    const contact = await findContact(tenant.id, phone, "");
    if (!contact) return Response.json({ known: false });
    const next = (await db().list("appointments", { contactId: contact.id }))
      .filter((a) => ["scheduled", "confirmed"].includes(a.status) && new Date(a.startsAt).getTime() > Date.now())
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    return Response.json({
      known: true,
      name: fullName(contact),
      lastAskedAbout: contact.interest,
      upcomingAppointment: next ? formatWhen(tenant, next.startsAt) : null,
    });
  }

  if (body.tool === "book_appointment") {
    if (!hasFeature(tenant, "agent_booking")) return Response.json({ booked: false, say: "I'll have someone call you to set that up." });
    const startsAt = new Date(String(body.startsAt ?? ""));
    if (!phone || Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
      return Response.json({ booked: false, say: "I couldn't set that time. I'll have someone call you to confirm." });
    }
    const [firstName, ...rest] = String(body.name ?? "").trim().split(/\s+/);
    const contact =
      (await findContact(tenant.id, phone, "")) ??
      (await ingestLead(tenant, { firstName, lastName: rest.join(" "), phone, interest: String(body.reason ?? ""), source: "phone", smsConsent: body.smsConsent === true }));
    const appointment = await bookAppointment(tenant, contact, { title: String(body.reason ?? "Appointment"), startsAt: startsAt.toISOString(), bookedBy: "receptionist" });
    return Response.json({ booked: true, say: `You're booked for ${formatWhen(tenant, appointment.startsAt)}.` });
  }

  return Response.json({ error: "Unknown tool." }, { status: 400 });
}
