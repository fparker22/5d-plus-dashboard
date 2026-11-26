import { Mail, MessageSquare, Phone } from "lucide-react";
import { Submit } from "@/components/client";
import { PageHeader } from "@/components/ui";
import { runEngine, runReactivation, simulateMissedCall, toggleSequence } from "@/lib/actions";
import { hasFeature, type Feature } from "@/lib/plans";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import type { SequenceStep, SequenceTrigger } from "@/lib/types";

const STARTS: Record<SequenceTrigger, string> = {
  new_lead: "Starts when a new lead comes in",
  missed_call: "Starts when a call goes unanswered",
  appointment: "Starts when an appointment is booked",
  no_show: "Starts when someone misses their appointment",
  review: "Starts when a contact is marked Won",
  nurture: "Starts when a lead goes quiet or says not now",
  reactivation: "Started by you, for past customers",
};
const NEEDS: Partial<Record<SequenceTrigger, Feature>> = { no_show: "no_show_recovery", nurture: "nurture_drip", reactivation: "reactivation" };

function when(step: SequenceStep, index: number): string {
  const m = Math.abs(step.delayMinutes);
  const d = Math.round(m / 1440);
  const span = m === 0 ? "" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} hr` : `${d} ${d === 1 ? "day" : "days"}`;
  if (step.anchor === "appointment") return `${span} before`;
  if (m === 0) return index === 0 ? "Right away" : "Same moment";
  return index === 0 ? `After ${span}` : `${span} later`;
}

export default async function AutomationsPage() {
  const tenant = await currentTenant();
  const [sequences, enrollments, templates] = await Promise.all([
    db().list("sequences", { tenantId: tenant.id }),
    db().list("enrollments", { tenantId: tenant.id }),
    db().list("templates", { tenantId: tenant.id }),
  ]);
  const Icon = { sms: MessageSquare, email: Mail, call: Phone };

  return (
    <>
      <PageHeader title="Automations" lead="Seven sequences cover the whole customer journey. Each step is checked for consent and sending hours before it goes out, and every sequence stops the moment its job is done.">
        <form action={simulateMissedCall}><Submit className="btn" busy="Ringing…">Demo a missed call</Submit></form>
        <form action={runEngine}><Submit busy="Running…">Send what&rsquo;s due now</Submit></form>
      </PageHeader>
      <div className="space-y-5">
        {sequences.map((seq) => {
          const locked = NEEDS[seq.key] && !hasFeature(tenant, NEEDS[seq.key]!);
          const active = enrollments.filter((e) => e.sequenceKey === seq.key && e.status === "active").length;
          const finished = enrollments.filter((e) => e.sequenceKey === seq.key && e.status !== "active").length;
          return (
            <section key={seq.id} className={`panel ${locked || !seq.active ? "opacity-70" : ""}`}>
              <div className="panel-head">
                <div>
                  <h2 className="text-lg font-semibold">{seq.name}</h2>
                  <p className="text-sm text-muted">{STARTS[seq.key]}. {seq.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="text-muted">{active} in progress{finished ? `, ${finished} finished` : ""}</span>
                  {locked ? <span className="pill bg-fog text-muted">Not in this plan</span> : (
                    <>
                      {seq.key === "reactivation" && <form action={runReactivation}><Submit className="btn" busy="Starting…">Start a win-back</Submit></form>}
                      <form action={toggleSequence}><input type="hidden" name="sequenceId" value={seq.id} /><Submit className="btn" busy="…">{seq.active ? "Pause" : "Turn on"}</Submit></form>
                    </>
                  )}
                </div>
              </div>
              <ol className="flex flex-wrap gap-x-2 gap-y-3 px-5 py-4">
                {seq.steps.map((step, i) => {
                  const I = Icon[step.channel];
                  const tpl = templates.find((t) => t.key === step.templateKey);
                  return (
                    <li key={i} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden className="h-px w-5 bg-spruce-200" />}
                      <span className="rounded-md border border-line px-3 py-2 text-sm">
                        <span className="block text-xs text-muted">{when(step, i)}</span>
                        <span className="flex items-center gap-1.5 font-medium"><I className="h-3.5 w-3.5 text-spruce-700" />{tpl?.name.split(" — ")[1] ?? step.templateKey}</span>
                      </span>
                    </li>
                  );
                })}
                <li className="flex items-center gap-2 text-sm text-muted">
                  <span aria-hidden className="h-px w-5 bg-spruce-200" />
                  {seq.loopFromStep !== null ? "repeats until they reply or opt out" : seq.thenStart ? "then the long-term drip" : "done"}
                </li>
              </ol>
              <p className="border-t border-line px-5 py-2.5 text-xs text-muted">{seq.stopOnReply ? "Stops as soon as the person replies." : "Keeps running if the person replies."} Texts wait for {tenant.settings.quietStartHour}:00 to {tenant.settings.quietEndHour}:00 local time.</p>
            </section>
          );
        })}
      </div>
    </>
  );
}
