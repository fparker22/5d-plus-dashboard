import { DEFAULT_SEQUENCES, DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from "./defaults";
import { getPlan } from "./plans";
import { db, newId } from "./store";
import type { PlanId, Tenant } from "./types";

/** Creates a client business with the full starter kit of templates and sequences. */
export async function provisionTenant(input: {
  name: string;
  industry?: string;
  plan?: PlanId;
  ownerName?: string;
  ownerEmail?: string;
  phone?: string;
  bookingUrl?: string;
  reviewUrl?: string;
  knowledgeBase?: string;
  services?: string[];
}): Promise<Tenant> {
  const plan = getPlan(input.plan ?? "starter");
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  const taken = new Set((await db().list("tenants")).map((t) => t.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  const tenant = await db().insert("tenants", {
    id: newId("tnt"),
    slug,
    name: input.name,
    industry: input.industry ?? "",
    plan: plan.id,
    monthlyPrice: plan.monthly,
    status: "onboarding",
    tagline: "",
    knowledgeBase: input.knowledgeBase ?? "",
    services: input.services ?? [],
    settings: {
      ...DEFAULT_SETTINGS,
      // New clients start with the approval gate on until the owner trusts the wording.
      autopilot: false,
      ownerName: input.ownerName ?? "",
      ownerEmail: input.ownerEmail ?? "",
      fromName: input.name,
      phone: input.phone ?? "",
      bookingUrl: input.bookingUrl ?? "",
      reviewUrl: input.reviewUrl ?? "",
    },
    createdAt: new Date().toISOString(),
  });
  for (const t of DEFAULT_TEMPLATES) await db().insert("templates", { ...t, id: newId("tpl"), tenantId: tenant.id });
  for (const s of DEFAULT_SEQUENCES) await db().insert("sequences", { ...s, steps: s.steps.map((x) => ({ ...x })), id: newId("seq"), tenantId: tenant.id });
  return tenant;
}

