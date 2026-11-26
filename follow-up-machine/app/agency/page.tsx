import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoSelect, Submit } from "@/components/client";
import { createTenant, switchTenant, updateTenantPlan } from "@/lib/actions";
import { isSignedIn } from "@/lib/auth";
import { computeMetrics, formatDuration, loadSnapshot, money } from "@/lib/metrics";
import { getPlan, PLANS } from "@/lib/plans";
import { listTenants } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function AgencyPage() {
  if (!(await isSignedIn())) redirect("/login");
  const tenants = await listTenants();
  const rows = await Promise.all(tenants.map(async (t) => ({ t, m: computeMetrics(await loadSnapshot(t.id)) })));
  const active = tenants.filter((t) => t.status === "active");
  const mrr = active.reduce((s, t) => s + t.monthlyPrice, 0);
  const costLow = active.reduce((s, t) => s + getPlan(t.plan).costLow, 0);
  const costHigh = active.reduce((s, t) => s + getPlan(t.plan).costHigh, 0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
      <Link href="/app" className="btn-quiet -ml-2 mb-3"><ArrowLeft className="h-4 w-4" />Back to the dashboard</Link>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Agency</h1>
        <p className="mt-1.5 max-w-2xl text-muted">Every client business you run, on one page. Open one to work inside it, change its plan, or add a new client with the full kit of sequences and messages already in place.</p>
      </header>

      <dl className="mb-8 grid grid-cols-2 gap-6 border-y border-line py-5 md:grid-cols-4">
        <div><dt className="text-sm text-muted">Clients</dt><dd className="display mt-1 text-2xl font-semibold">{tenants.length}</dd><dd className="text-xs text-muted">{active.length} active</dd></div>
        <div><dt className="text-sm text-muted">Monthly recurring revenue</dt><dd className="display mt-1 text-2xl font-semibold">{money(mrr)}</dd></div>
        <div><dt className="text-sm text-muted">Estimated cost to deliver</dt><dd className="display mt-1 text-2xl font-semibold">{money(costLow)} to {money(costHigh)}</dd><dd className="text-xs text-muted">tools and usage, per month</dd></div>
        <div><dt className="text-sm text-muted">Estimated margin</dt><dd className="display mt-1 text-2xl font-semibold">{mrr ? `${Math.round(((mrr - costHigh) / mrr) * 100)}%+` : "—"}</dd><dd className="text-xs text-muted">before your time</dd></div>
      </dl>

      <div className="panel mb-8 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="px-5 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Plan and status</th><th className="px-3 py-3 text-right font-medium">Contacts</th><th className="px-3 py-3 text-right font-medium">New this week</th><th className="px-3 py-3 text-right font-medium">First response</th><th className="px-3 py-3 text-right font-medium">Needs a person</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ t, m }) => (
              <tr key={t.id}>
                <td className="px-5 py-3"><p className="font-medium">{t.name}</p><p className="text-muted">{t.industry || "No industry set"}</p></td>
                <td className="px-3 py-3">
                  <form action={updateTenantPlan} className="flex flex-wrap gap-1.5">
                    <input type="hidden" name="tenantId" value={t.id} />
                    <AutoSelect name="plan" label={`Plan for ${t.name}`} defaultValue={t.plan} options={PLANS.map((p) => ({ value: p.id, label: `${p.name} (${money(p.monthly)})` }))} />
                    <AutoSelect name="status" label={`Status of ${t.name}`} defaultValue={t.status} options={[{ value: "onboarding", label: "Onboarding" }, { value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} />
                  </form>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{Object.values(m.stageCounts).reduce((a, b) => a + b, 0)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{m.newThisWeek}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatDuration(m.medianResponseSeconds)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{m.openTasks + m.pendingApprovals > 0 ? <span className="pill bg-bell-soft text-bell-deep">{m.openTasks + m.pendingApprovals}</span> : "0"}</td>
                <td className="px-5 py-3 text-right"><form action={switchTenant}><input type="hidden" name="tenantId" value={t.id} /><input type="hidden" name="next" value="/app" /><Submit className="btn" busy="Opening…">Open</Submit></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={createTenant} className="panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <h2 className="text-lg font-semibold sm:col-span-2 lg:col-span-5">Add a client</h2>
        <div><label className="label" htmlFor="name">Business name</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="industry">Kind of business</label><input id="industry" name="industry" className="input" placeholder="e.g. landscaping" /></div>
        <div><label className="label" htmlFor="ownerName">Owner&rsquo;s name</label><input id="ownerName" name="ownerName" className="input" /></div>
        <div><label className="label" htmlFor="plan">Plan</label><select id="plan" name="plan" className="input">{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <Submit busy="Setting up…">Create and open settings</Submit>
        <p className="text-sm text-muted sm:col-span-2 lg:col-span-5">New clients start in onboarding with autopilot off, so nothing goes out until the wording has been reviewed.</p>
      </form>
    </main>
  );
}
