import { Check } from "lucide-react";
import Link from "next/link";
import { Submit } from "@/components/client";
import { ActivityIcon, ActivityRow, Empty, PageHeader } from "@/components/ui";
import { approve, approveAll, completeTask, reject } from "@/lib/actions";
import { agentName } from "@/lib/agents";
import { timeAgo } from "@/lib/metrics";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName } from "@/lib/types";

export default async function InboxPage() {
  const tenant = await currentTenant();
  const [activities, tasks, contacts] = await Promise.all([
    db().list("activities", { tenantId: tenant.id }),
    db().list("tasks", { tenantId: tenant.id }),
    db().list("contacts", { tenantId: tenant.id }),
  ]);
  const byId = new Map(contacts.map((c) => [c.id, c]));
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = activities.filter((a) => a.status === "pending_approval");
  const open = tasks.filter((t) => t.status === "open").sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.createdAt.localeCompare(a.createdAt));
  const replies = activities.filter((a) => a.type.endsWith("_in") || a.type === "missed_call").slice(0, 15);

  return (
    <>
      <PageHeader title="Inbox" lead={tenant.settings.autopilot ? "Autopilot is on: the team sends on its own and only brings you what needs a person." : "Autopilot is off: nothing goes out until you approve it here."}>
        <Link href="/app/settings#autopilot" className="btn">Change autopilot</Link>
      </PageHeader>

      <section className="panel mb-6 border-bell/60">
        <div className="panel-head bg-bell-soft/60">
          <h2 className="text-lg font-semibold">Waiting for your OK <span className="font-normal text-muted">{pending.length}</span></h2>
          {pending.length > 1 && <form action={approveAll}><Submit className="btn-bell" busy="Sending…">Approve all {pending.length}</Submit></form>}
        </div>
        {pending.length === 0 ? (
          <Empty title="Nothing is waiting">{tenant.settings.autopilot ? "With autopilot on, messages go out as soon as they clear the consent and sending-hours checks." : "New messages from the team will line up here."}</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((a) => {
              const c = byId.get(a.contactId);
              return (
                <li key={a.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-muted"><ActivityIcon type={a.type} />{a.type === "email_out" ? "Email" : "Text"} to <Link href={`/app/contacts/${a.contactId}`} className="font-medium text-ink hover:underline">{c ? fullName(c) : "contact"}</Link> from the {agentName(a.agent)}, drafted {timeAgo(a.createdAt)}</p>
                    {a.subject && <p className="mt-2 font-medium">{a.subject}</p>}
                    <p className="mt-1 whitespace-pre-line rounded-md bg-fog px-3 py-2 text-sm">{a.body}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <form action={approve}><input type="hidden" name="activityId" value={a.id} /><Submit busy="Sending…">Approve and send</Submit></form>
                    <form action={reject}><input type="hidden" name="activityId" value={a.id} /><Submit className="btn" busy="…">Don&rsquo;t send</Submit></form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-head"><h2 className="text-lg font-semibold">Your call list <span className="font-normal text-muted">{open.length}</span></h2></div>
          {open.length === 0 ? <Empty title="No follow-ups for you" /> : (
            <ul className="divide-y divide-line">
              {open.map((t) => (
                <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                  <form action={completeTask} className="pt-0.5">
                    <input type="hidden" name="taskId" value={t.id} />
                    <Submit className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-transparent hover:border-spruce-700 hover:text-spruce-700" busy="…"><Check className="h-3.5 w-3.5" /><span className="sr-only">Mark done: {t.title}</span></Submit>
                  </form>
                  <div className="min-w-0">
                    <p className="font-medium">{t.urgent && <span className="pill mr-2 bg-alert-soft text-alert">Urgent</span>}<Link href={`/app/contacts/${t.contactId}`} className="hover:underline">{t.title}</Link></p>
                    <p className="text-sm text-muted">{t.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <div className="panel-head"><h2 className="text-lg font-semibold">Latest from customers</h2></div>
          {replies.length === 0 ? <Empty title="No replies yet" /> : (
            <ul className="divide-y divide-line">
              {replies.map((a) => { const c = byId.get(a.contactId); return <ActivityRow key={a.id} a={a} who={c ? fullName(c) : undefined} href={`/app/contacts/${a.contactId}`} />; })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
