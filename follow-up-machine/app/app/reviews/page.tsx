import { Star } from "lucide-react";
import Link from "next/link";
import { Submit } from "@/components/client";
import { Empty, PageHeader } from "@/components/ui";
import { draftResponse, saveResponse } from "@/lib/actions";
import { timeAgo } from "@/lib/metrics";
import { hasFeature } from "@/lib/plans";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName } from "@/lib/types";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-bell text-bell" : "text-line"}`} />)}
    </span>
  );
}

export default async function ReviewsPage() {
  const tenant = await currentTenant();
  const [reviews, contacts] = await Promise.all([db().list("reviews", { tenantId: tenant.id }), db().list("contacts", { tenantId: tenant.id })]);
  const byId = new Map(contacts.map((c) => [c.id, c]));
  reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const received = reviews.filter((r) => r.rating > 0);
  const waiting = reviews.filter((r) => r.status === "requested");
  const avg = received.length ? received.reduce((s, r) => s + r.rating, 0) / received.length : 0;
  const canDraft = hasFeature(tenant, "review_responses");

  return (
    <>
      <PageHeader title="Reviews" lead="Every customer marked Won is asked for a review two hours later, with one reminder. Low ratings come to you before anything is posted." />
      <dl className="mb-6 grid grid-cols-3 gap-6 border-y border-line py-5">
        <div><dt className="text-sm text-muted">Average rating</dt><dd className="display mt-1 text-2xl font-semibold">{received.length ? avg.toFixed(1) : "—"}</dd></div>
        <div><dt className="text-sm text-muted">Reviews received</dt><dd className="display mt-1 text-2xl font-semibold">{received.length}</dd><dd className="text-xs text-muted">{reviews.length ? Math.round((received.length / reviews.length) * 100) : 0}% of requests</dd></div>
        <div><dt className="text-sm text-muted">Still waiting on</dt><dd className="display mt-1 text-2xl font-semibold">{waiting.length}</dd></div>
      </dl>
      <div className="panel">
        {received.length === 0 ? (
          <Empty title="No reviews yet">{tenant.settings.reviewUrl ? "Mark a contact as Won and the request goes out on its own." : "Add your review link in Settings so requests can go out."}</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {received.map((r) => {
              const c = byId.get(r.contactId);
              return (
                <li key={r.id} className="grid gap-4 px-5 py-4 lg:grid-cols-2">
                  <div>
                    <p className="flex flex-wrap items-center gap-2"><Stars n={r.rating} /><Link href={`/app/contacts/${r.contactId}`} className="font-medium hover:underline">{c ? fullName(c) : "Customer"}</Link><span className="text-sm text-muted">on {r.platform}, {timeAgo(r.createdAt)}</span></p>
                    <p className="mt-1.5">{r.text || "No comment left."}</p>
                    {r.rating <= 3 && <p className="mt-2 text-sm text-alert">Low rating: reply personally, and consider a phone call.</p>}
                  </div>
                  <div className="space-y-2">
                    <form action={saveResponse} className="space-y-2">
                      <input type="hidden" name="reviewId" value={r.id} />
                      <textarea name="response" rows={3} defaultValue={r.response} aria-label="Your reply" placeholder="Write a public reply" className="input" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Submit className="btn" busy="Saving…">{r.status === "responded" ? "Update reply" : "Save reply"}</Submit>
                        {r.status === "responded" && <span className="text-sm text-good">Replied</span>}
                      </div>
                    </form>
                    {canDraft && <form action={draftResponse}><input type="hidden" name="reviewId" value={r.id} /><Submit className="btn-quiet" busy="Writing…">Have the Reputation Manager draft one</Submit></form>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">Replies are saved here for you to post on the review site. Reading and posting reviews directly through Google Business Profile is on the roadmap.</p>
    </>
  );
}
