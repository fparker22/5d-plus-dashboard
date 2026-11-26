import Link from "next/link";
import { Submit } from "@/components/client";
import { Empty, PageHeader, StagePill } from "@/components/ui";
import { addContact } from "@/lib/actions";
import { formatPhone } from "@/lib/compliance";
import { money, timeAgo } from "@/lib/metrics";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName, STAGES, type StageId } from "@/lib/types";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; new?: string }> }) {
  const { q = "", stage = "", new: adding } = await searchParams;
  const tenant = await currentTenant();
  const all = (await db().list("contacts", { tenantId: tenant.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const needle = q.toLowerCase();
  const contacts = all.filter(
    (c) => (!stage || c.stage === stage) && (!needle || `${fullName(c)} ${c.email} ${c.phone} ${c.interest}`.toLowerCase().includes(needle)),
  );
  const link = (s: string) => `/app/contacts?${new URLSearchParams({ ...(q && { q }), ...(s && { stage: s }) })}`;

  return (
    <>
      <PageHeader title="Contacts" lead={`${all.length} people in ${tenant.name}'s database. Everyone who calls, texts or fills in a form lands here automatically.`}>
        <Link href="/app/contacts?new=1" className="btn-primary">Add a contact</Link>
      </PageHeader>

      {adding && (
        <form action={addContact} className="panel mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <h2 className="text-lg font-semibold sm:col-span-2 lg:col-span-3">Add a contact</h2>
          <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" name="firstName" className="input" required /></div>
          <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" name="lastName" className="input" /></div>
          <div><label className="label" htmlFor="phone">Mobile phone</label><input id="phone" name="phone" type="tel" className="input" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" /></div>
          <div><label className="label" htmlFor="interest">What they need</label><input id="interest" name="interest" className="input" /></div>
          <div>
            <label className="label" htmlFor="source">How they found you</label>
            <select id="source" name="source" className="input" defaultValue="walk_in">
              <option value="walk_in">Walked in</option><option value="phone">Phone call</option><option value="referral">Referral</option><option value="social">Social media</option><option value="import">Existing customer</option>
            </select>
          </div>
          <label className="flex items-start gap-2 text-sm sm:col-span-2 lg:col-span-3">
            <input type="checkbox" name="smsConsent" className="mt-1" />
            <span>They said yes to receiving texts from {tenant.name}. Leave this unchecked unless they clearly agreed.</span>
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Submit busy="Adding…">Add and start follow-up</Submit>
            <Link href="/app/contacts" className="btn">Cancel</Link>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="mr-2 flex gap-2">
          {stage && <input type="hidden" name="stage" value={stage} />}
          <input name="q" defaultValue={q} placeholder="Search name, phone, email" aria-label="Search contacts" className="input w-64" />
          <button className="btn">Search</button>
        </form>
        <Link href={link("")} className={`pill ${!stage ? "bg-spruce-900 text-white" : "bg-paper ring-1 ring-inset ring-line"}`}>All {all.length}</Link>
        {STAGES.map((s) => (
          <Link key={s.id} href={link(s.id)} className={`pill ${stage === s.id ? "bg-spruce-900 text-white" : "bg-paper ring-1 ring-inset ring-line"}`}>
            {s.label} {all.filter((c) => c.stage === s.id).length}
          </Link>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        {contacts.length === 0 ? (
          <Empty title="No contacts match">Clear the search or pick a different stage.</Empty>
        ) : (
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Asked about</th>
                <th className="px-3 py-3 font-medium">Reach them by</th>
                <th className="px-3 py-3 text-right font-medium">Score</th>
                <th className="px-3 py-3 text-right font-medium">Value</th>
                <th className="px-5 py-3 text-right font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-spruce-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/app/contacts/${c.id}`} className="font-medium hover:underline">{fullName(c)}</Link>
                    {c.urgent && <span className="pill ml-2 bg-alert-soft text-alert">Urgent</span>}
                  </td>
                  <td className="px-3 py-3"><StagePill stage={c.stage as StageId} /></td>
                  <td className="max-w-[14rem] truncate px-3 py-3 text-muted">{c.interest || "—"}</td>
                  <td className="px-3 py-3 text-muted">
                    {c.optedOut ? "Opted out" : [c.phone && (c.smsConsent ? "Text" : "Call only"), c.email && "Email"].filter(Boolean).join(", ") || "No contact info"}
                    {c.phone && <span className="block text-xs">{formatPhone(c.phone)}</span>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.score}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.value ? money(c.value) : "—"}</td>
                  <td className="px-5 py-3 text-right text-muted">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
