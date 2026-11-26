import Link from "next/link";
import { AutoSelect } from "@/components/client";
import { PageHeader } from "@/components/ui";
import { moveStage } from "@/lib/actions";
import { money, timeAgo } from "@/lib/metrics";
import { db } from "@/lib/store";
import { currentTenant } from "@/lib/tenant";
import { fullName, STAGES } from "@/lib/types";

export default async function PipelinePage() {
  const tenant = await currentTenant();
  const contacts = (await db().list("contacts", { tenantId: tenant.id })).sort((a, b) => b.score - a.score);
  const columns = STAGES.filter((s) => s.id !== "lost");
  const options = STAGES.map((s) => ({ value: s.id, label: s.label }));

  return (
    <>
      <PageHeader title="Pipeline" lead="Contacts move along on their own as they reply, book and buy. Move one by hand when something happens offline." />
      <div className="-mx-5 overflow-x-auto px-5 pb-4 lg:-mx-10 lg:px-10">
        <div className="grid min-w-[60rem] grid-cols-6 gap-3">
          {columns.map((col) => {
            const list = contacts.filter((c) => c.stage === col.id);
            const total = list.reduce((s, c) => s + c.value, 0);
            return (
              <section key={col.id} aria-label={col.label}>
                <div className={`mb-2 border-t-2 pt-2 ${col.id === "nurture" ? "border-line" : "border-spruce-900"}`}>
                  <h2 className="text-base font-semibold">{col.label} <span className="font-normal text-muted">{list.length}</span></h2>
                  <p className="text-xs text-muted">{col.hint}{total ? `, ${money(total)}` : ""}</p>
                </div>
                <ul className="space-y-2">
                  {list.slice(0, 12).map((c) => (
                    <li key={c.id} className="panel p-3 text-sm">
                      <Link href={`/app/contacts/${c.id}`} className="font-medium hover:underline">{fullName(c)}</Link>
                      <p className="truncate text-muted">{c.interest || "No details yet"}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                        <span>{c.value ? money(c.value) : `Score ${c.score}`}, {timeAgo(c.lastInboundAt ?? c.createdAt)}</span>
                      </div>
                      <form action={moveStage} className="mt-2">
                        <input type="hidden" name="contactId" value={c.id} />
                        <AutoSelect name="stage" label={`Move ${fullName(c)}`} defaultValue={c.stage} options={options} className="w-full !py-1 text-xs" />
                      </form>
                    </li>
                  ))}
                  {list.length > 12 && <li className="px-1 text-xs text-muted"><Link href={`/app/contacts?stage=${col.id}`} className="underline">{list.length - 12} more</Link></li>}
                  {list.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">Nobody here right now</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
