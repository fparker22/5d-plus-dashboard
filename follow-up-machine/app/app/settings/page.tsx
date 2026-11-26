import { Check, Minus } from "lucide-react";
import { Submit } from "@/components/client";
import { PageHeader } from "@/components/ui";
import { saveSettings } from "@/lib/actions";
import { getPlan } from "@/lib/plans";
import { integrationStatus } from "@/lib/providers/messaging";
import { isDemoData } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";

function Field({ name, label, value, hint, type = "text" }: { name: string; label: string; value: string | number; hint?: string; type?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value} className="input" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function SettingsPage() {
  const tenant = await currentTenant();
  const s = tenant.settings;
  const status = integrationStatus();
  const connections = [
    { name: "Database", on: status.database, detail: isDemoData() ? "Using built-in demo data. Add Supabase keys to keep real records." : "Supabase" },
    { name: "Texting and calls", on: status.sms, detail: "Twilio" },
    { name: "Email", on: status.email, detail: "Resend" },
    { name: "AI replies and scoring", on: status.ai, detail: status.ai ? "Claude" : "Using built-in rules until a Claude key is added" },
    { name: "Phone attendant", on: status.voice && Boolean(s.voiceAgentId), detail: "ElevenLabs" },
    { name: "Social scheduling", on: status.social && Boolean(s.metricoolBlogId), detail: "Metricool" },
  ];

  return (
    <>
      <PageHeader title="Settings" lead={`${tenant.name} is on the ${getPlan(tenant.plan).name} plan. Its public lead form lives at /f/${tenant.slug}.`}>
        <a href={`/f/${tenant.slug}`} target="_blank" rel="noreferrer" className="btn">Open the lead form</a>
      </PageHeader>
      <form action={saveSettings} className="space-y-6">
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold">The business</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Business name" value={tenant.name} />
            <Field name="industry" label="What kind of business" value={tenant.industry} />
            <Field name="tagline" label="Tagline" value={tenant.tagline} hint="Shown at the top of the lead form." />
            <Field name="services" label="Services" value={tenant.services.join(", ")} hint="Separate with commas. These become the choices on the lead form." />
            <Field name="ownerName" label="Owner's name" value={s.ownerName} hint="Signs the emails." />
            <Field name="ownerEmail" label="Owner's email" value={s.ownerEmail} type="email" hint="Customer replies go here." />
            <Field name="website" label="Website" value={s.website} />
            <Field name="brandColor" label="Brand color" value={s.brandColor} type="color" />
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-1 text-lg font-semibold">Fact sheet</h2>
          <p className="mb-3 max-w-2xl text-sm text-muted">Everything the agents are allowed to say: hours, prices, address, policies. If it isn&rsquo;t written here, the agents won&rsquo;t guess. They&rsquo;ll take a message for you instead.</p>
          <textarea name="knowledgeBase" defaultValue={tenant.knowledgeBase} rows={9} aria-label="Fact sheet" className="input" />
          <div className="mt-4"><Field name="voiceTone" label="How the team should sound" value={s.voiceTone} /></div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold">Reaching customers</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Business line" value={s.phone} hint="The Twilio number customers call and text, like +15175550142." />
            <Field name="forwardPhone" label="Ring this phone first" value={s.forwardPhone} hint="If nobody answers in 20 seconds, the caller gets a text back." />
            <Field name="fromName" label="Emails come from" value={s.fromName} />
            <Field name="fromEmail" label="Sending address" value={s.fromEmail} type="email" hint="Always a business address, never a personal one." />
            <Field name="bookingUrl" label="Booking link" value={s.bookingUrl} hint="Calendly, Google Calendar appointment page, or your own scheduler." />
            <Field name="reviewUrl" label="Review link" value={s.reviewUrl} />
          </div>
        </section>

        <section className="panel p-5" id="autopilot">
          <h2 className="mb-4 text-lg font-semibold">Sending rules</h2>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="autopilot" defaultChecked={s.autopilot} className="mt-1 h-4 w-4" />
            <span><span className="font-medium">Autopilot</span><span className="block text-sm text-muted">On: the team sends messages on its own. Off: every message waits in the Inbox for your OK. New businesses start with it off.</span></span>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field name="quietStartHour" label="Earliest text (hour)" value={s.quietStartHour} type="number" />
            <Field name="quietEndHour" label="Latest text (hour)" value={s.quietEndHour} type="number" hint="24-hour clock. 20 means 8 p.m." />
            <Field name="timezone" label="Time zone" value={s.timezone} />
          </div>
          <p className="mt-3 text-sm text-muted">Three rules can&rsquo;t be turned off: texts only go to people who said yes, nothing goes to anyone who opted out, and texts and calls stay inside these hours.</p>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold">Linked accounts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="voiceAgentId" label="ElevenLabs agent" value={s.voiceAgentId} hint="The ID of the phone attendant built for this business." />
            <Field name="metricoolBlogId" label="Metricool brand" value={s.metricoolBlogId} hint="The brand ID used to schedule social posts." />
          </div>
        </section>

        <Submit busy="Saving…">Save settings</Submit>
      </form>

      <section className="panel mt-8" id="connections">
        <div className="panel-head"><h2 className="text-lg font-semibold">Connections</h2><span className={`pill ${status.live ? "bg-spruce-900 text-white" : "bg-bell-soft text-bell-deep"}`}>{status.live ? "Live sending is on" : "Test mode"}</span></div>
        <ul className="divide-y divide-line">
          {connections.map((c) => (
            <li key={c.name} className="flex items-center gap-3 px-5 py-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${c.on ? "bg-spruce-100 text-spruce-900" : "bg-fog text-muted"}`}>{c.on ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</span>
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-muted">{c.on ? `Connected: ${c.detail}` : c.detail.includes(" ") ? c.detail : `Not connected (${c.detail})`}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-5 py-3 text-sm text-muted">Connections are set once for the whole agency in the server&rsquo;s environment file; see the setup guide in the README. Until live sending is switched on, every message is logged but not delivered.</p>
      </section>
    </>
  );
}
