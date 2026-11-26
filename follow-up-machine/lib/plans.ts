import type { PlanId, Tenant } from "./types";

// The service ladder. Prices are the recommended starting list prices for the
// agency; the cost figures are estimates to be re-checked against each vendor's
// current pricing before quoting (see docs/BUSINESS_BLUEPRINT.md).

export type Feature =
  | "crm"
  | "lead_form"
  | "instant_ack"
  | "missed_call_textback"
  | "booking_link"
  | "sequences"
  | "review_requests"
  | "dashboard"
  | "voice_agent"
  | "ai_replies"
  | "ai_qualification"
  | "agent_booking"
  | "no_show_recovery"
  | "nurture_drip"
  | "reactivation"
  | "review_responses"
  | "social_content"
  | "social_scheduling"
  | "creative_studio"
  | "outbound_calls"
  | "strategy_call";

export interface Plan {
  id: PlanId;
  name: string;
  promise: string;
  monthly: number;
  setup: number;
  /** Estimated monthly cost to deliver for a typical client. */
  costLow: number;
  costHigh: number;
  includes: string[];
  limits: string[];
  features: Feature[];
}

const STARTER: Feature[] = [
  "crm",
  "lead_form",
  "instant_ack",
  "missed_call_textback",
  "booking_link",
  "sequences",
  "review_requests",
  "dashboard",
];

const GROWTH: Feature[] = [
  ...STARTER,
  "voice_agent",
  "ai_replies",
  "ai_qualification",
  "agent_booking",
  "no_show_recovery",
  "nurture_drip",
  "reactivation",
  "review_responses",
];

const PREMIUM: Feature[] = [
  ...GROWTH,
  "social_content",
  "social_scheduling",
  "creative_studio",
  "outbound_calls",
  "strategy_call",
];

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Follow-Up Machine",
    promise: "Every lead hears back in under a minute, and nobody falls through the cracks.",
    monthly: 297,
    setup: 497,
    costLow: 20,
    costHigh: 45,
    includes: [
      "Branded lead form and contact database",
      "Instant text and email acknowledgement",
      "Missed-call text-back",
      "Booking link in every message",
      "Three follow-up sequences, written for the business",
      "Appointment reminders",
      "Review requests after each job",
      "Dashboard and daily briefing",
    ],
    limits: ["Up to 500 contacts", "1,000 texts a month", "One location"],
    features: STARTER,
  },
  {
    id: "growth",
    name: "AI Front Office",
    promise: "A receptionist and follow-up team that answers every call and text, day or night.",
    monthly: 697,
    setup: 997,
    costLow: 90,
    costHigh: 170,
    includes: [
      "Everything in Follow-Up Machine",
      "AI phone attendant answering 24/7",
      "Two-way AI text and email replies",
      "Lead scoring and qualification",
      "The agent books appointments itself",
      "No-show recovery",
      "Long-term drip for people who did not buy",
      "Win-back campaigns to past customers",
      "Drafted replies to every review",
    ],
    limits: ["Up to 2,500 contacts", "300 voice minutes a month", "3,000 texts a month"],
    features: GROWTH,
  },
  {
    id: "premium",
    name: "Complete Business System",
    promise: "Front office plus a marketing team: content planned, created, posted and measured.",
    monthly: 1497,
    setup: 1997,
    costLow: 260,
    costHigh: 420,
    includes: [
      "Everything in AI Front Office",
      "Monthly campaign plan and content calendar",
      "16 social posts a month, written and designed",
      "Short-form video and image creative",
      "Scheduling and analytics across every network",
      "Outbound AI call campaigns",
      "Monthly strategy call and report",
    ],
    limits: ["Up to 10,000 contacts", "1,000 voice minutes a month", "Up to 3 locations"],
    features: PREMIUM,
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function hasFeature(tenant: Pick<Tenant, "plan">, feature: Feature): boolean {
  return getPlan(tenant.plan).features.includes(feature);
}

export const ADD_ONS = [
  { name: "Extra voice minutes", price: "$0.25 a minute" },
  { name: "Additional location or phone line", price: "$97 a month" },
  { name: "Landing page or website refresh", price: "From $750 one time" },
  { name: "Paid ads management", price: "$500 a month plus ad spend" },
  { name: "Database clean-up and import", price: "$250 one time" },
];
