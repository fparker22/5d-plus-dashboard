import Link from "next/link";
import { AutoSelect } from "@/components/client";
import { Empty, PageHeader } from "@/components/ui";
import { updateAppointment } from "@/lib/actions";
import { agentName } from "@/lib/agents";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName, type Appointment } from "@/lib/types";

const STATUS = [{ value: "scheduled", label: "Scheduled" }, { value: "confirmed", label: "Confirmed" }, { value: "completed", label: "Completed" }, { value: "no_show", label: "Didn't show" }, { value: "cancelled", label: "Cancelled" }];

export default async function CalendarPage() {
  const tenant = await currentTenant();
  const [appointments, contacts] = await Promise.all([db().list("appointments", { tenantId: tenant.id }), db().list("contacts", { tenantId: tenant.id })]);
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const tz = tenant.settings.timezone;
  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
  const dayLabel = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
  const time = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const today = dayKey(new Date().toISOString());
  const upcoming = appointments.filter((a) => dayKey(a.startsAt) >= today && a.status !== "cancelled").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const needOutcome = appointments.filter((a) => new Date(a.startsAt).getTime() < Date.now() && ["scheduled", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => dayKey(a.startsAt) < today).sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 10);
  const days = new Map<string, Appointment[]>();
  upcoming.forEach((a) => days.set(dayKey(a.startsAt), [...(days.get(dayKey(a.startsAt)) ?? []), a]));

  const Row = ({ a }: { a: Appointment }) => {
    const c = byId.get(a.contactId);
    return (
      <li className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 px-5 py-3">
        <span className="tabular-nums">{time(a.startsAt)}</span>
        <div className="min-w-0">
          <Link href={`/app/contacts/${a.contactId}`} className="font-medium hover:underline">{c ? fullName(c) : "Contact"}</Link>
          <p className="truncate text-sm text-muted">{a.title}, {a.durationMinutes} min{a.location ? `, ${a.location}` : ""}. Booked by {agentName(a.bookedBy).toLowerCase() === "you" ? "you" : `the ${agentName(a.bookedBy)}`}.</p>
        </div>
        <form action={updateAppointment}><input type="hidden" name="appointmentId" value={a.id} /><AutoSelect name="status" label="Appointment status" defaultValue={a.status} options={STATUS} /></form>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Calendar" lead="Every appointment gets a confirmation, a reminder the day before and another two hours ahead. Mark what happened and the right follow-up starts.">
        {tenant.settings.bookingUrl && <a href={tenant.settings.bookingUrl} className="btn" target="_blank" rel="noreferrer">Open booking page</a>}
      </PageHeader>
      {needOutcome.length > 0 && (
        <section className="panel mb-6 border-bell/60">
          <div className="panel-head bg-bell-soft/60"><h2 className="text-lg font-semibold">What happened? <span className="font-normal text-muted">{needOutcome.length}</span></h2></div>
          <ul className="divide-y divide-line">{needOutcome.map((a) => <Row key={a.id} a={a} />)}</ul>
        </section>
      )}
      {days.size === 0 ? <div className="panel"><Empty title="Nothing booked yet">Book an appointment from any contact&rsquo;s page, or let the booking link do it.</Empty></div> : (
        <div className="space-y-5">
          {[...days.entries()].map(([key, list]) => (
            <section key={key} className="panel">
              <div className="panel-head"><h2 className="text-lg font-semibold">{key === today ? "Today" : dayLabel(list[0].startsAt)}</h2><span className="text-sm text-muted">{list.length} booked</span></div>
              <ul className="divide-y divide-line">{list.map((a) => <Row key={a.id} a={a} />)}</ul>
            </section>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <section className="panel mt-6">
          <div className="panel-head"><h2 className="text-lg font-semibold">Recent</h2></div>
          <ul className="divide-y divide-line">{past.map((a) => (
            <li key={a.id} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-sm">
              <span><Link href={`/app/contacts/${a.contactId}`} className="font-medium hover:underline">{byId.get(a.contactId) ? fullName(byId.get(a.contactId)!) : "Contact"}</Link> <span className="text-muted">{a.title}</span></span>
              <span className="text-muted">{dayLabel(a.startsAt)}, {STATUS.find((s) => s.value === a.status)?.label.toLowerCase()}</span>
            </li>
          ))}</ul>
        </section>
      )}
    </>
  );
}
