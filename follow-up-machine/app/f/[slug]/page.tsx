import { notFound, redirect } from "next/navigation";
import { Submit } from "@/components/client";
import { ingestLead } from "@/lib/engine";
import { tenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// The public lead form for one business. Share the link, put it behind a QR
// code, or embed it on the business's website.
export default async function LeadFormPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { slug } = await params;
  const { sent, error } = await searchParams;
  const tenant = await tenantBySlug(slug);
  if (!tenant) notFound();
  const color = tenant.settings.brandColor || "#0F3D3E";

  async function submit(form: FormData) {
    "use server";
    const t = await tenantBySlug(slug);
    if (!t) return;
    const text = (k: string) => String(form.get(k) ?? "").trim().slice(0, 2000);
    if (text("company_website")) redirect(`/f/${slug}?sent=1`); // honeypot
    if (!text("phone") && !text("email")) redirect(`/f/${slug}?error=contact`);
    await ingestLead(t, {
      firstName: text("firstName"),
      lastName: text("lastName"),
      phone: text("phone"),
      email: text("email"),
      interest: text("interest"),
      message: text("message"),
      source: "web_form",
      smsConsent: form.get("smsConsent") === "on",
    });
    redirect(`/f/${slug}?sent=1`);
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="h-2" style={{ background: color }} />
      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="display text-2xl font-semibold" style={{ color }}>{tenant.name}</p>
        {sent ? (
          <div className="mt-8">
            <h1 className="text-3xl font-semibold">Thank you. We&rsquo;ve got it.</h1>
            <p className="mt-3 text-muted">Check your phone or inbox: a confirmation is on its way, and someone from {tenant.name} will follow up shortly.</p>
            {tenant.settings.bookingUrl && <a href={tenant.settings.bookingUrl} className="btn-primary mt-6" style={{ background: color, borderColor: color }}>Pick a time now</a>}
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-semibold">How can we help?</h1>
            <p className="mt-2 text-muted">{tenant.tagline || "Tell us what you need and we'll get right back to you."}</p>
            {error && <p className="mt-4 rounded-md bg-alert-soft px-3 py-2 text-sm text-alert">Add a phone number or an email so we can reach you.</p>}
            <form action={submit} className="mt-7 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" name="firstName" required autoComplete="given-name" className="input" /></div>
                <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" className="input" /></div>
                <div><label className="label" htmlFor="phone">Mobile phone</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" /></div>
                <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" className="input" /></div>
              </div>
              {tenant.services.length > 0 && (
                <div>
                  <label className="label" htmlFor="interest">What do you need?</label>
                  <select id="interest" name="interest" className="input" defaultValue="">
                    <option value="">Choose one</option>
                    {tenant.services.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                    <option value="something else">Something else</option>
                  </select>
                </div>
              )}
              <div><label className="label" htmlFor="message">Anything we should know?</label><textarea id="message" name="message" rows={3} className="input" /></div>
              <input name="company_website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              <label className="flex items-start gap-2.5 text-sm">
                <input type="checkbox" name="smsConsent" className="mt-1" />
                <span>Yes, {tenant.name} may text me about my request, appointments and occasional updates. Message and data rates may apply. Reply STOP at any time to opt out. Consent is not a condition of purchase.</span>
              </label>
              <Submit busy="Sending…">Send my request</Submit>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
