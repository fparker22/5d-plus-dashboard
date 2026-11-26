import { BellRing, Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoSelect } from "@/components/client";
import { Nav } from "@/components/nav";
import { signOut, switchTenant } from "@/lib/actions";
import { authEnabled, isSignedIn } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { integrationStatus } from "@/lib/providers/messaging";
import { db, isDemoData } from "@/lib/store";
import { currentTenant, listTenants } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSignedIn())) redirect("/login");
  const [tenant, tenants] = await Promise.all([currentTenant(), listTenants()]);
  const [activities, tasks] = await Promise.all([db().list("activities", { tenantId: tenant.id }), db().list("tasks", { tenantId: tenant.id })]);
  const inboxCount = activities.filter((a) => a.status === "pending_approval").length + tasks.filter((t) => t.status === "open").length;
  const status = integrationStatus();

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[15.5rem_1fr]">
      <aside className="bg-spruce-900 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:block">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bell text-spruce-950">
              <BellRing className="h-4.5 w-4.5" />
            </span>
            <span className="display text-lg font-semibold">Follow-Up Machine</span>
          </Link>
          <form action={switchTenant} className="lg:mt-5">
            <label className="mb-1 hidden text-xs text-spruce-200/70 lg:block" htmlFor="tenant-switch">
              Business
            </label>
            <AutoSelect
              name="tenantId"
              label="Switch business"
              defaultValue={tenant.id}
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              className="w-44 border-white/20 !bg-spruce-800 text-white lg:w-full"
            />
            <p className="mt-1.5 hidden text-xs text-spruce-200/80 lg:block">{getPlan(tenant.plan).name} plan</p>
          </form>
        </div>
        <Nav inboxCount={inboxCount} />
        <div className="hidden space-y-1 border-t border-white/10 px-3 py-4 lg:mt-6 lg:block">
          <Link href="/agency" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-spruce-100 hover:bg-white/6">
            <Building2 className="h-4 w-4" />
            Agency view
          </Link>
          {authEnabled() && (
            <form action={signOut}>
              <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-spruce-100 hover:bg-white/6">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        {(isDemoData() || !status.live) && (
          <p className="border-b border-bell/40 bg-bell-soft px-5 py-2 text-sm text-bell-deep">
            {isDemoData() ? "You're looking at demo data that resets when the server restarts. " : ""}
            {!status.live ? "Test mode is on, so no texts, emails or calls reach real people." : ""}{" "}
            <Link href="/app/settings#connections" className="font-medium underline">
              See connections
            </Link>
          </p>
        )}
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
