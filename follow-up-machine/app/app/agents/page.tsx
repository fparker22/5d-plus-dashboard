import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { AGENTS, CALL_DATA_FIELDS, receptionistFirstMessage, receptionistPrompt } from "@/lib/agents";
import { loadSnapshot } from "@/lib/metrics";
import { getPlan, hasFeature, PLANS } from "@/lib/plans";
import { currentTenant } from "@/lib/tenant";

export default async function AgentsPage() {
  const tenant = await currentTenant();
  const snap = await loadSnapshot(tenant.id);
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const done = (id: string) => snap.activities.filter((a) => a.agent === id && new Date(a.createdAt).getTime() > week).length;
  const teams = ["Front office", "Follow-up", "Marketing", "Operations"] as const;
  const unlockedBy = (feature: Parameters<typeof hasFeature>[1]) => PLANS.find((p) => p.features.includes(feature))?.name ?? "";

  return (
    <>
      <PageHeader title="Your team" lead={`${AGENTS.filter((a) => hasFeature(tenant, a.requires)).length} of ${AGENTS.length} agents are working for ${tenant.name} on the ${getPlan(tenant.plan).name} plan. Each one has a single job and knows when to hand off to a person.`} />
      <div className="space-y-8">
        {teams.map((team) => (
          <section key={team}>
            <h2 className="mb-3 text-xl font-semibold">{team}</h2>
            <div className="panel divide-y divide-line">
              {AGENTS.filter((a) => a.team === team).map((agent) => {
                const on = hasFeature(tenant, agent.requires);
                return (
                  <article key={agent.id} className={`grid gap-x-6 gap-y-2 px-5 py-4 md:grid-cols-[13rem_1fr_9rem] ${on ? "" : "bg-fog/60"}`}>
                    <div>
                      <h3 className="text-base font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted">{agent.channels}</p>
                    </div>
                    <div className="text-sm">
                      <p>{agent.job}</p>
                      <p className="mt-1.5 text-muted"><span className="font-medium text-ink">Hands off when:</span> {agent.handsOffWhen}</p>
                      <p className="mt-1 text-muted"><span className="font-medium text-ink">Runs on:</span> {agent.tools}</p>
                    </div>
                    <div className="text-sm md:text-right">
                      {on ? (
                        <>
                          <p className="font-medium text-good">Working</p>
                          <p className="text-muted">{done(agent.id)} actions this week</p>
                        </>
                      ) : (
                        <p className="inline-flex items-center gap-1.5 text-muted"><Lock className="h-3.5 w-3.5" />In {unlockedBy(agent.requires)}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-1 text-xl font-semibold">Phone attendant script</h2>
          <p className="mb-3 max-w-2xl text-muted">Built from this business&rsquo;s settings and fact sheet. This is exactly what gets loaded into the voice agent, so editing the fact sheet in Settings changes what callers hear.</p>
          <div className="panel">
            <div className="border-b border-line px-5 py-4">
              <p className="text-sm text-muted">Greeting</p>
              <p className="mt-1">&ldquo;{receptionistFirstMessage(tenant)}&rdquo;</p>
            </div>
            <details className="border-b border-line px-5 py-4">
              <summary className="cursor-pointer font-medium">Full instructions</summary>
              <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md bg-fog p-4 font-sans text-sm">{receptionistPrompt(tenant)}</pre>
            </details>
            <details className="px-5 py-4">
              <summary className="cursor-pointer font-medium">What it writes down after every call</summary>
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
                {Object.entries(CALL_DATA_FIELDS).map(([key, f]) => (
                  <div key={key}><dt className="font-medium">{key.replace(/_/g, " ")}</dt><dd className="text-muted">{f.description}</dd></div>
                ))}
              </dl>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
