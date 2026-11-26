import { Check } from "lucide-react";
import Link from "next/link";
import { Submit } from "@/components/client";
import { ActivityRow, Empty, JourneyLine, PageHeader } from "@/components/ui";
import { completeTask } from "@/lib/actions";
import { formatWhen } from "@/lib/engine";
import { computeMetrics, formatDuration, loadSnapshot, money } from "@/lib/metrics";
import { currentTenant } from "@/lib/tenant";
import { fullName } from "@/lib/types";

export default async function TodayPage() {
  const tenant = await currentTenant();
  const snap = await loadSnapshot(tenant.id);
  const m = computeMetrics(snap);
  const byId = new Map(snap.contacts.map((c) => [c.id, c]));
  const tasks = snap.tasks.filter((t) => t.status === "open").sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.createdAt.localeCompare(a.createdAt));
  const upcoming = snap.appointments
    .filter((a) => ["scheduled", "confirmed"].includes(a.status) && new Date(a.startsAt).getTime() > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 5);
  const recent = snap.activities.filter((a) => a.type !== "stage_change" && a.status !== "pending_approval").slice(0, 9);
  const peak = Math.max(1, ...m.leadsByDay.map((d) => d.count));
  const trend = m.newThisWeek - m.newLastWeek;
  const firstName = tenant.settings.ownerName.replace(/^Dr\.\s+/, "Dr. ").split(" ").slice(0, tenant.settings.ownerName.startsWith("Dr.") ? 2 : 1).join(" ");

  const facts = [
    { label: "Typical first response", value: formatDuration(m.medianResponseSeconds), note: "from lead to first message" },
    { label: "New leads this week", value: String(m.newThisWeek), note: trend === 0 ? "same as last week" : `${Math.abs(trend)} ${trend > 0 ? "more" : "fewer"} than last week` },
    { label: "Replied to us", value: `${Math.round(m.replyRate * 100)}%`, note: "of everyone we contacted" },
    { label: "Booked this week", value: String(m.bookedThisWeek), note: `${money(m.pipelineValue)} still in the pipeline` },
    { label: "Won in 30 days", value: money(m.wonValueThisMonth), note: `${m.wonThisMonth} new customers` },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Today, ${firstName}` : "Today"}
        lead={`The team handled ${m.handledAutomatically} things this week without you. ${tasks.length + m.pendingApprovals === 0 ? "Nothing is waiting on you." : `${tasks.length + m.pendingApprovals} ${tasks.length + m.pendingApprovals === 1 ? "thing needs" : "things need"} a person.`}`}
      >
        <Link href="/app/contacts?new=1" className="btn-primary">
          Add a contact
        </Link>
      </PageHeader>

      <section className="panel px-4 pb-6 pt-7 sm:px-8">
        <JourneyLine counts={m.reached} />
        <p className="mt-5 text-center text-sm text-muted">
          How far your {snap.contacts.length} contacts have travelled. {m.stageCounts.nurture} more are on the long-term drip, and {m.activeSequences} sequences are running right now.
        </p>
      </section>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 md:grid-cols-5">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="display mt-1 text-2xl font-semibold tabular-nums">{f.value}</dd>
            <dd className="text-xs text-muted">{f.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className="panel border-bell/60">
          <div className="panel-head bg-bell-soft/60">
            <h2 className="text-lg font-semibold">Needs a person</h2>
            {m.pendingApprovals > 0 && (
              <Link href="/app/inbox" className="btn-bell">
                Review {m.pendingApprovals} waiting {m.pendingApprovals === 1 ? "message" : "messages"}
              </Link>
            )}
          </div>
          {tasks.length === 0 ? (
            <Empty title="You're all caught up">The team will put anything it can&rsquo;t handle here: callbacks, upset customers, people with no way to message.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {tasks.slice(0, 7).map((t) => {
                const c = byId.get(t.contactId);
                return (
                  <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                    <form action={completeTask} className="pt-0.5">
                      <input type="hidden" name="taskId" value={t.id} />
                      <Submit className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-transparent hover:border-spruce-700 hover:text-spruce-700" busy="…">
                        <Check className="h-3.5 w-3.5" />
                        <span className="sr-only">Mark done: {t.title}</span>
                      </Submit>
                    </form>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {t.urgent && <span className="pill mr-2 bg-alert-soft text-alert">Urgent</span>}
                        {c ? <Link href={`/app/contacts/${c.id}`} className="hover:underline">{t.title}</Link> : t.title}
                      </p>
                      <p className="text-sm text-muted">{t.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="text-lg font-semibold">Coming up</h2>
            <Link href="/app/calendar" className="btn-quiet">Open calendar</Link>
          </div>
          {upcoming.length === 0 ? (
            <Empty title="No appointments on the books">Book one from any contact&rsquo;s page.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => {
                const c = byId.get(a.contactId);
                return (
                  <li key={a.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/app/contacts/${a.contactId}`} className="font-medium hover:underline">{c ? fullName(c) : "Contact"}</Link>
                      <p className="truncate text-sm text-muted">{a.title}</p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p>{formatWhen(tenant, a.startsAt)}</p>
                      <p className={a.status === "confirmed" ? "text-good" : "text-muted"}>{a.status === "confirmed" ? "Confirmed" : "Not confirmed yet"}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-line px-5 py-4">
            <p className="text-sm text-muted">New leads, last 14 days</p>
            <div className="mt-2 flex h-16 items-end gap-1" role="img" aria-label={`New leads per day for the last 14 days, ${m.leadsByDay.map((d) => d.count).join(", ")}`}>
              {m.leadsByDay.map((d) => (
                <span key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-t-sm bg-spruce-700" style={{ height: `${Math.max(4, (d.count / peak) * 100)}%`, opacity: d.count ? 1 : 0.2 }} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="panel mt-6">
        <div className="panel-head">
          <h2 className="text-lg font-semibold">What the team has been doing</h2>
        </div>
        <ul className="divide-y divide-line">
          {recent.map((a) => {
            const c = byId.get(a.contactId);
            return <ActivityRow key={a.id} a={a} who={c ? fullName(c) : undefined} href={`/app/contacts/${a.contactId}`} />;
          })}
        </ul>
      </section>
    </>
  );
}
