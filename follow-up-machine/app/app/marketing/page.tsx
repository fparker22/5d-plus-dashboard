import { Submit } from "@/components/client";
import { Empty, Locked, PageHeader } from "@/components/ui";
import { approvePost, deletePost, generatePosts, savePost } from "@/lib/actions";
import { isoToLocalInput } from "@/lib/compliance";
import { hasFeature } from "@/lib/plans";
import { integrationStatus } from "@/lib/providers/messaging";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import type { SocialPost } from "@/lib/types";

const NETWORK: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", gmb: "Google Business" };

export default async function MarketingPage() {
  const tenant = await currentTenant();
  if (!hasFeature(tenant, "social_content")) {
    return (
      <>
        <PageHeader title="Marketing" lead="A strategist, a copywriter, a creative director and a publisher, planning and posting for the business every month." />
        <Locked feature="The marketing team" plan="Complete Business System" />
      </>
    );
  }
  const posts = await db().list("social_posts", { tenantId: tenant.id });
  const when = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-US", { timeZone: tenant.settings.timezone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "No date yet");
  const local = (iso: string | null) => (iso ? isoToLocalInput(iso, tenant.settings.timezone) : "");
  const by = (s: SocialPost["status"]) => posts.filter((p) => p.status === s).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  const pending = by("pending_approval");
  const scheduled = by("scheduled");
  const published = by("published").reverse();
  const ideas = by("idea");
  const connected = integrationStatus().social && integrationStatus().live && tenant.settings.metricoolBlogId;

  return (
    <>
      <PageHeader title="Marketing" lead="The marketing team plans the content, writes it, briefs the visuals and schedules what you approve. Nothing is posted without your OK." />

      <form action={generatePosts} className="panel mb-6 grid gap-3 p-5 md:grid-cols-[1fr_8rem_auto] md:items-end">
        <div>
          <label className="label" htmlFor="brief">What should the next batch be about?</label>
          <input id="brief" name="brief" className="input" placeholder={`e.g. Promote ${tenant.services[0]?.toLowerCase() ?? "our main service"} this month and introduce the team`} />
        </div>
        <div>
          <label className="label" htmlFor="count">How many posts</label>
          <select id="count" name="count" defaultValue="4" className="input"><option>2</option><option>4</option><option>6</option><option>8</option></select>
        </div>
        <Submit busy="Planning…">Plan posts</Submit>
      </form>

      <section className="panel mb-6 border-bell/60">
        <div className="panel-head bg-bell-soft/60"><h2 className="text-lg font-semibold">Waiting for your OK <span className="font-normal text-muted">{pending.length}</span></h2></div>
        {pending.length === 0 ? <Empty title="No drafts waiting">Plan a batch above and the drafts will appear here for review.</Empty> : (
          <ul className="divide-y divide-line">
            {pending.map((p) => (
              <li key={p.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_17rem]">
                <form action={savePost} id={`save-${p.id}`} className="space-y-2.5">
                  <input type="hidden" name="postId" value={p.id} />
                  <p className="font-medium">{p.campaign} <span className="ml-1 text-sm font-normal text-muted">{p.platforms.map((n) => NETWORK[n] ?? n).join(", ")}</span></p>
                  <textarea name="caption" defaultValue={p.caption} rows={4} aria-label="Caption" className="input" />
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div><label className="label" htmlFor={`at-${p.id}`}>Post on</label><input id={`at-${p.id}`} type="datetime-local" name="scheduledAt" defaultValue={local(p.scheduledAt)} className="input" /></div>
                    <div><label className="label" htmlFor={`media-${p.id}`}>Image or video link</label><input id={`media-${p.id}`} name="mediaUrl" defaultValue={p.mediaUrl} placeholder="Paste once the creative is ready" className="input" /></div>
                  </div>
                </form>
                <div className="space-y-3 text-sm">
                  <div className="rounded-md bg-fog p-3">
                    <p className="text-xs text-muted">Brief for the Creative Director</p>
                    <p className="mt-1">{p.mediaPrompt || "No visual planned."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button form={`save-${p.id}`} className="btn">Save changes</button>
                    <form action={approvePost}><input type="hidden" name="postId" value={p.id} /><Submit busy="Scheduling…">Approve and schedule</Submit></form>
                    <form action={deletePost}><input type="hidden" name="postId" value={p.id} /><Submit className="btn-quiet !text-alert" busy="…">Discard</Submit></form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-head"><h2 className="text-lg font-semibold">Scheduled</h2><span className="text-sm text-muted">{connected ? "Publishing through Metricool" : "Test mode: not sent to Metricool"}</span></div>
          {scheduled.length === 0 ? <Empty title="Nothing scheduled" /> : (
            <ul className="divide-y divide-line">{scheduled.map((p) => (
              <li key={p.id} className="px-5 py-3">
                <p className="text-sm text-muted">{when(p.scheduledAt)} on {p.platforms.map((n) => NETWORK[n] ?? n).join(", ")}</p>
                <p className="mt-0.5">{p.caption}</p>
              </li>
            ))}</ul>
          )}
        </section>
        <section className="panel">
          <div className="panel-head"><h2 className="text-lg font-semibold">Published and ideas</h2></div>
          <ul className="divide-y divide-line">
            {published.map((p) => (
              <li key={p.id} className="px-5 py-3"><p className="text-sm text-muted">Posted {when(p.scheduledAt)}</p><p className="mt-0.5">{p.caption}</p></li>
            ))}
            {ideas.map((p) => (
              <li key={p.id} className="px-5 py-3"><p className="text-sm text-muted">Idea, not yet written</p><p className="mt-0.5">{p.caption}</p></li>
            ))}
            {published.length + ideas.length === 0 && <Empty title="Nothing here yet" />}
          </ul>
        </section>
      </div>
    </>
  );
}
