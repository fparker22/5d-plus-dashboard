import { cookies } from "next/headers";
import { db } from "./store";
import type { Tenant } from "./types";

export const TENANT_COOKIE = "fum_tenant";

export async function listTenants(): Promise<Tenant[]> {
  return (await db().list("tenants")).sort((a, b) => a.name.localeCompare(b.name));
}

/** The business the signed-in person is currently looking at. */
export async function currentTenant(): Promise<Tenant> {
  const tenants = await db().list("tenants");
  if (tenants.length === 0) throw new Error("No businesses exist yet. Add one from the Agency page.");
  const chosen = (await cookies()).get(TENANT_COOKIE)?.value;
  return tenants.find((t) => t.id === chosen) ?? tenants[0];
}

export async function tenantBySlug(slug: string): Promise<Tenant | null> {
  const [tenant] = await db().list("tenants", { slug } as Partial<Tenant>);
  return tenant ?? null;
}

/** Finds the business a webhook belongs to: ?tenant=slug, or the number that was called or texted. */
export async function tenantForWebhook(url: URL, toNumber?: string): Promise<Tenant | null> {
  const slug = url.searchParams.get("tenant");
  if (slug) return tenantBySlug(slug);
  if (toNumber) {
    const tenants = await db().list("tenants");
    return tenants.find((t) => t.settings.phone === toNumber) ?? null;
  }
  return null;
}
