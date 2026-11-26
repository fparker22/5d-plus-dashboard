import { BellRing, Check } from "lucide-react";
import Link from "next/link";
import { AGENTS } from "@/lib/agents";
import { money } from "@/lib/metrics";
import { ADD_ONS, PLANS } from "@/lib/plans";

// The agency's sales page. Set AGENCY_BOOKING_URL to your own scheduling link.
export const dynamic = "force-dynamic";
export default function HomePage() {
  const bookingUrl = process.env.AGENCY_BOOKING_URL || "/app";
  const thread = [
    { time: "Tue 9:02 pm", who: "Receptionist", text: "Maria calls about a water heater that stopped working. The office is closed. The phone attendant answers, takes her details and asks if it may text her." },
    { time: "Tue 9:03 pm", who: "Lead Concierge", text: "“Hi Maria, this is Parkside Heating & Air. Thanks for calling about your water heater. You can grab a time here…”" },
    { time: "Tue 9:06 pm", who: "Scheduler", text: "Maria books Wednesday at 10 a.m. A confirmation goes out by text and email." },
    { time: "Wed 8:00 am", who: "Scheduler", text: "Reminder sent. Maria replies C to confirm." },
    { time: "Wed 1:15 pm", who: "Reputation Manager", text: "Job done and marked Won. Two hours later Maria gets a thank-you and a review link." },
    { time: "Thu 7:40 am", who: "Chief of Staff", text: "Five stars from Maria. It’s the first line of the owner’s morning briefing." },
  ];
  const teams = ["Front office", "Follow-up", "Marketing", "Operations"] as const;

  return (
    <main>
      <section className="bg-spruce-900 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="flex items-center justify-between py-5" aria-label="Site">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bell text-spruce-950"><BellRing className="h-4.5 w-4.5" /></span>
              <span className="display text-lg font-semibold">Follow-Up Machine</span>
            </span>
            <span className="flex items-center gap-5 text-sm">
              <a href="#plans" className="hidden hover:underline sm:inline">Plans</a>
              <a href="#team" className="hidden hover:underline sm:inline">The team</a>
              <Link href="/app" className="rounded-md border border-white/30 px-3.5 py-2 font-medium hover:bg-white/10">Open the live demo</Link>
            </span>
          </nav>
          <div className="grid gap-12 pb-20 pt-10 lg:grid-cols-[1fr_27rem] lg:items-start lg:pt-16">
            <div>
              <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                The front desk that never goes home.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-spruce-100">
                A team of AI agents answers every call, replies to every lead in under a minute, books the appointment, sends the reminders and keeps in touch with everyone who isn&rsquo;t ready yet. You get a short list each morning of the few things that need a person.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={bookingUrl} className="btn-bell px-5 py-3 text-base">Book a 20-minute walkthrough</a>
                <a href="#plans" className="rounded-md border border-white/30 px-5 py-3 font-medium hover:bg-white/10">See plans and pricing</a>
              </div>
              <p className="mt-10 max-w-md text-sm text-spruce-200">Built for the businesses that live on the phone: home services, salons, dental and medical offices, law and insurance offices, gyms, churches and nonprofits.</p>
            </div>

            <div className="rounded-xl bg-paper p-5 text-ink shadow-2xl shadow-spruce-950/40">
              <p className="mb-4 text-sm text-muted">One lead, start to finish, with nobody at the desk</p>
              <ol className="arrive relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-0.5 before:bg-spruce-200">
                {thread.map((step) => (
                  <li key={step.time} className="relative pl-6">
                    <span aria-hidden className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-spruce-900 bg-paper" />
                    <p className="text-xs text-muted"><span className="tabular-nums">{step.time}</span>, {step.who}</p>
                    <p className="text-sm">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl text-4xl font-semibold">Most businesses don&rsquo;t lose customers to competitors. They lose them to silence.</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            ["The call nobody answered", "After hours, on a job, with a client: the phone rings out and the caller dials the next name on the list. Here, every call is answered or texted back within a minute."],
            ["The lead nobody chased", "One reply is rarely enough. The system follows up for a week, then stays in touch for months, and stops the moment the person replies or asks it to."],
            ["The customer nobody thanked", "Reminders before the visit, a review request after it, and a nudge when it has been too long. Repeat business, without anyone remembering to do it."],
          ].map(([title, body]) => (
            <div key={title} className="border-t-2 border-spruce-900 pt-4">
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-4xl font-semibold">Meet the team you&rsquo;re hiring</h2>
          <p className="mt-3 max-w-2xl text-muted">Thirteen agents, each with one job. They only say what is on your fact sheet, they always say they&rsquo;re an AI when asked, and they hand anything sensitive to you.</p>
          <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team}>
                <h3 className="mb-3 text-xl font-semibold">{team}</h3>
                <dl className="divide-y divide-line border-y border-line">
                  {AGENTS.filter((a) => a.team === team).map((a) => (
                    <div key={a.id} className="grid gap-1 py-3 sm:grid-cols-[10.5rem_1fr]">
                      <dt className="font-medium">{a.name}</dt>
                      <dd className="text-sm text-muted">{a.job}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-4xl font-semibold">Three ways to work with us</h2>
        <p className="mt-3 max-w-2xl text-muted">Start with follow-up, add the front office when you&rsquo;re ready, and hand over marketing when you want the whole system. Month to month, and we set everything up for you.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <article key={plan.id} className={`flex flex-col rounded-xl border p-6 ${i === 1 ? "border-spruce-900 bg-spruce-900 text-white" : "border-line bg-paper"}`}>
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className={`mt-2 min-h-[4.5rem] text-sm ${i === 1 ? "text-spruce-100" : "text-muted"}`}>{plan.promise}</p>
              <p className="mt-4"><span className="display text-4xl font-semibold">{money(plan.monthly)}</span><span className={i === 1 ? "text-spruce-100" : "text-muted"}> a month</span></p>
              <p className={`text-sm ${i === 1 ? "text-spruce-100" : "text-muted"}`}>plus {money(plan.setup)} one-time setup</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.includes.map((item) => (
                  <li key={item} className="flex gap-2.5"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${i === 1 ? "text-bell" : "text-spruce-700"}`} />{item}</li>
                ))}
              </ul>
              <p className={`mt-6 border-t pt-4 text-xs ${i === 1 ? "border-white/20 text-spruce-100" : "border-line text-muted"}`}>{plan.limits.join(". ")}.</p>
              <a href={bookingUrl} className={`mt-5 ${i === 1 ? "btn-bell" : "btn-primary"}`}>Start with {plan.name}</a>
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold">Add-ons</h3>
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              {ADD_ONS.map((a) => <div key={a.name} className="flex justify-between gap-4 py-2.5"><dt>{a.name}</dt><dd className="text-muted">{a.price}</dd></div>)}
            </dl>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Churches and nonprofits</h3>
            <p className="mt-3 text-muted">This system started as a volunteer and guest follow-up line for a church&rsquo;s community Thanksgiving meal. Registered nonprofits and congregations take 20% off any plan, and the sequences come ready for guests, volunteers and donors.</p>
          </div>
        </div>
      </section>

      <section className="bg-spruce-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-14">
          <h2 className="max-w-xl text-3xl font-semibold">See it run on a business like yours before you decide.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/app" className="rounded-md border border-white/30 px-5 py-3 font-medium hover:bg-white/10">Open the live demo</Link>
            <a href={bookingUrl} className="btn-bell px-5 py-3 text-base">Book a walkthrough</a>
          </div>
        </div>
      </section>
    </main>
  );
}
