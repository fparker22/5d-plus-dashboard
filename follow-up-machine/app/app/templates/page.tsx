import { Submit } from "@/components/client";
import { PageHeader } from "@/components/ui";
import { saveTemplate } from "@/lib/actions";
import { render } from "@/lib/engine";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import type { Contact } from "@/lib/types";

const TAGS = ["first_name", "business", "booking_url", "review_url", "phone", "owner_name", "interest_clause", "appointment_time", "services"];

export default async function TemplatesPage() {
  const tenant = await currentTenant();
  const templates = await db().list("templates", { tenantId: tenant.id });
  const sample = { firstName: "Jordan", lastName: "Lee", interest: tenant.services[0]?.toLowerCase() ?? "your services" } as Contact;
  const groups = new Map<string, typeof templates>();
  templates.forEach((t) => { const g = t.name.split(" — ")[0]; groups.set(g, [...(groups.get(g) ?? []), t]); });

  return (
    <>
      <PageHeader title="Messages" lead={`The words the team uses for ${tenant.name}. Edit any of them; the preview shows what a customer named Jordan would receive.`} />
      <p className="mb-6 rounded-md bg-spruce-50 px-4 py-3 text-sm">
        Fill-in tags you can use: {TAGS.map((t, i) => <span key={t}><code className="rounded bg-paper px-1 py-0.5 text-spruce-900">{`{{${t}}}`}</code>{i < TAGS.length - 1 ? " " : ""}</span>)}
      </p>
      <div className="space-y-8">
        {[...groups.entries()].map(([group, list]) => (
          <section key={group}>
            <h2 className="mb-3 text-xl font-semibold">{group}</h2>
            <div className="space-y-4">
              {list.map((t) => (
                <form key={t.id} action={saveTemplate} className="panel grid gap-4 p-5 lg:grid-cols-2">
                  <input type="hidden" name="templateId" value={t.id} />
                  <div className="space-y-2.5">
                    <p className="font-medium">{t.name.split(" — ")[1] ?? t.name} <span className="pill ml-1 bg-fog text-muted">{t.channel === "sms" ? "Text" : "Email"}</span></p>
                    {t.channel === "email" && <input name="subject" defaultValue={t.subject} aria-label="Subject" className="input" />}
                    <textarea name="body" defaultValue={t.body} rows={t.channel === "email" ? 9 : 4} aria-label="Message" className="input" />
                    <Submit className="btn" busy="Saving…">Save message</Submit>
                  </div>
                  <div className="rounded-md bg-fog p-4 text-sm">
                    <p className="mb-2 text-xs text-muted">Preview</p>
                    {t.subject && <p className="mb-2 font-medium">{render(t.subject, tenant, sample)}</p>}
                    <p className="whitespace-pre-line">{render(t.body, tenant, sample)}</p>
                    {t.channel === "sms" && <p className="mt-3 text-xs text-muted">{render(t.body, tenant, sample).length} characters, {Math.ceil(render(t.body, tenant, sample).length / 153)} text segment{render(t.body, tenant, sample).length > 160 ? "s" : ""}</p>}
                  </div>
                </form>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
