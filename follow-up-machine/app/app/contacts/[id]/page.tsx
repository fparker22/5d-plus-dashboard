import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoSelect, ResetForm, Submit } from "@/components/client";
import { ActivityRow, JourneyLine, StagePill } from "@/components/ui";
import { addNote, createAppointment, moveStage, sendMessage, simulateReply, updateAppointment, updateConsent } from "@/lib/actions";
import { canContact, formatPhone, isoToLocalInput } from "@/lib/compliance";
import { formatWhen } from "@/lib/engine";
import { money, timeAgo } from "@/lib/metrics";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName, SOURCE_LABEL, STAGES, type Activity, type Appointment, type Enrollment } from "@/lib/types";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await currentTenant();
  const contact = await db().get("contacts", id);
  if (!contact || contact.tenantId !== tenant.id) notFound();
  const [activities, appointments, enrollments, sequences] = await Promise.all([
    db().list("activities", { contactId: id } as Partial<Activity>),
    db().list("appointments", { contactId: id } as Partial<Appointment>),
    db().list("enrollments", { contactId: id, status: "active" } as Partial<Enrollment>),
    db().list("sequences", { tenantId: tenant.id }),
  ]);
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  appointments.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const sms = canContact(contact, "sms");
  const email = canContact(contact, "email");
  // Default the booking form to 10 a.m. tomorrow, in the business's own time zone.
  const localValue = `${isoToLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), tenant.settings.timezone).slice(0, 10)}T10:00`;

  return (
    <>
      <Link href="/app/contacts" className="btn-quiet -ml-2 mb-3"><ArrowLeft className="h-4 w-4" />All contacts</Link>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{fullName(contact)}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <StagePill stage={contact.stage} />
            {contact.urgent && <span className="pill bg-alert-soft text-alert">Urgent</span>}
            {contact.interest && <span>Asked about {contact.interest}</span>}
            <span>Added {timeAgo(contact.createdAt)} from {SOURCE_LABEL[contact.source]}</span>
          </p>
        </div>
        <form action={moveStage} className="flex items-center gap-2">
          <input type="hidden" name="contactId" value={contact.id} />
          <label htmlFor="stage" className="text-sm text-muted">Move to</label>
          <AutoSelect name="stage" label="Move to stage" defaultValue={contact.stage} options={STAGES.map((s) => ({ value: s.id, label: s.label }))} />
        </form>
      </header>

      <section className="panel mb-6 px-4 py-5 sm:px-8">
        <JourneyLine current={contact.stage} />
        {(contact.stage === "nurture" || contact.stage === "lost") && (
          <p className="mt-3 text-center text-sm text-muted">
            {contact.stage === "nurture" ? "Off the main line for now: on the long-term drip until they reply." : "Closed. Nothing more will be sent."}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="panel">
            <div className="panel-head"><h2 className="text-lg font-semibold">Send a message</h2></div>
            {contact.optedOut ? (
              <p className="px-5 py-4 text-muted">{contact.firstName || "This person"} asked not to be contacted, so messaging is turned off.</p>
            ) : !sms.ok && !email.ok ? (
              <p className="px-5 py-4 text-muted">There&rsquo;s no way to message {contact.firstName || "this person"} yet: {sms.reason.toLowerCase()}, and {email.reason.toLowerCase()}. Call them, then record their permission to text on the right.</p>
            ) : (
              <ResetForm action={sendMessage} className="space-y-3 p-5">
                <input type="hidden" name="contactId" value={contact.id} />
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className={`flex items-center gap-2 ${sms.ok ? "" : "text-muted"}`}><input type="radio" name="channel" value="sms" defaultChecked={sms.ok} disabled={!sms.ok} />Text{!sms.ok && ` (${sms.reason.toLowerCase()})`}</label>
                  <label className={`flex items-center gap-2 ${email.ok ? "" : "text-muted"}`}><input type="radio" name="channel" value="email" defaultChecked={!sms.ok && email.ok} disabled={!email.ok} />Email{!email.ok && ` (${email.reason.toLowerCase()})`}</label>
                </div>
                <textarea name="body" rows={3} required aria-label="Message" placeholder={`Write to ${contact.firstName || "them"}…`} className="input" />
                <Submit busy="Sending…">Send message</Submit>
              </ResetForm>
            )}
            {!contact.optedOut && (
              <details className="border-t border-line px-5 py-3 text-sm">
                <summary className="cursor-pointer text-muted">Demo: play the customer&rsquo;s reply</summary>
                <ResetForm action={simulateReply} className="mt-3 flex gap-2">
                  <input type="hidden" name="contactId" value={contact.id} />
                  <input name="body" required aria-label="Customer reply" placeholder="e.g. Do you have anything Thursday?" className="input" />
                  <Submit className="btn" busy="…">Receive</Submit>
                </ResetForm>
                <p className="mt-2 text-muted">Shows what happens when this person texts back: sequences stop, the stage moves, and the team answers. Try STOP, or C when an appointment is booked.</p>
              </details>
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h2 className="text-lg font-semibold">History</h2></div>
            <ul className="divide-y divide-line">
              {activities.map((a) => <ActivityRow key={a.id} a={a} />)}
            </ul>
            <ResetForm action={addNote} className="flex gap-2 border-t border-line p-4">
              <input type="hidden" name="contactId" value={contact.id} />
              <input name="body" required aria-label="Note" placeholder="Add a note for the team" className="input" />
              <Submit className="btn" busy="…">Add note</Submit>
            </ResetForm>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5 text-sm">
            <h2 className="mb-3 text-lg font-semibold">Details</h2>
            <dl className="space-y-2.5">
              <div className="flex justify-between gap-3"><dt className="text-muted">Phone</dt><dd>{contact.phone ? formatPhone(contact.phone) : "None"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="truncate">{contact.email || "None"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Lead score</dt><dd className="tabular-nums">{contact.score} of 100</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Estimated value</dt><dd className="tabular-nums">{contact.value ? money(contact.value) : "Unknown"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Last heard from</dt><dd>{contact.lastInboundAt ? timeAgo(contact.lastInboundAt) : "Never"}</dd></div>
            </dl>
            {contact.phone && !contact.optedOut && (
              <form action={updateConsent} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="contactId" value={contact.id} />
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="smsConsent" defaultChecked={contact.smsConsent} className="mt-1" />
                  <span>Has given permission to receive texts</span>
                </label>
                <Submit className="btn mt-3" busy="Saving…">Save permission</Submit>
              </form>
            )}
          </section>

          <section className="panel p-5 text-sm">
            <h2 className="mb-3 text-lg font-semibold">Running now</h2>
            {enrollments.length === 0 ? (
              <p className="text-muted">No sequences are running for {contact.firstName || "this person"}.</p>
            ) : (
              <ul className="space-y-3">
                {enrollments.map((e) => {
                  const seq = sequences.find((s) => s.key === e.sequenceKey);
                  return (
                    <li key={e.id}>
                      <p className="font-medium">{seq?.name ?? e.sequenceKey}</p>
                      <p className="text-muted">Step {Math.min(e.stepIndex + 1, seq?.steps.length ?? 1)} of {seq?.steps.length ?? "?"}, next {timeAgo(e.nextRunAt)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel p-5 text-sm">
            <h2 className="mb-3 text-lg font-semibold">Appointments</h2>
            {appointments.length > 0 && (
              <ul className="mb-4 space-y-3">
                {appointments.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-muted">{formatWhen(tenant, a.startsAt)}</p>
                    <form action={updateAppointment} className="mt-1.5">
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <AutoSelect name="status" label={`Status of ${a.title}`} defaultValue={a.status} options={[{ value: "scheduled", label: "Scheduled" }, { value: "confirmed", label: "Confirmed" }, { value: "completed", label: "Completed" }, { value: "no_show", label: "Didn't show" }, { value: "cancelled", label: "Cancelled" }]} />
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={createAppointment} className="space-y-2.5">
              <input type="hidden" name="contactId" value={contact.id} />
              <div><label className="label" htmlFor="title">Book for</label><input id="title" name="title" defaultValue={contact.interest} placeholder="What is it for?" className="input" /></div>
              <div><label className="label" htmlFor="startsAt">When ({tenant.name}&rsquo;s local time)</label><input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={localValue} className="input" /></div>
              <Submit className="btn" busy="Booking…">Book appointment</Submit>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
