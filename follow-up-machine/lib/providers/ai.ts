import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { houseRules } from "../agents";
import type { Contact, Tenant } from "../types";

// The thinking behind the agents. Every function has a rule-based fallback so
// the product still works (less cleverly) when no Anthropic key is configured,
// and so a declined or failed request never blocks a customer conversation.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

async function ask<T extends z.ZodType>(system: string, user: string, schema: T, maxTokens = 2000): Promise<z.infer<T> | null> {
  if (!aiAvailable()) return null;
  client ??= new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort: "low", format: zodOutputFormat(schema) },
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn("AI rate limited; using fallback.");
    else if (error instanceof Anthropic.APIError) console.warn(`AI request failed (${error.status}); using fallback.`);
    else console.warn("AI request failed; using fallback.", error);
    return null;
  }
}

// ── Qualifier ────────────────────────────────────────────────────────────────

const Qualification = z.object({
  score: z.number().describe("0-100. How likely this lead is to become a paying customer soon."),
  urgent: z.boolean().describe("True for emergencies, safety issues, or an upset customer."),
  summary: z.string().describe("One plain sentence a busy owner can read at a glance."),
  estimatedValue: z.number().describe("Best estimate of the job's dollar value from the fact sheet; 0 if unknown."),
});
export type Qualification = z.infer<typeof Qualification>;

const URGENT = /\b(emergency|urgent|asap|right away|today|no heat|flood|leak|pain|toothache|broken|smell gas|complain|lawyer|refund)\b/i;

export async function qualifyLead(tenant: Tenant, contact: Contact, message: string): Promise<Qualification> {
  const ai = await ask(
    `${houseRules(tenant)}\n\nYou are the Qualifier. Score the new lead described by the user. Base the estimated value only on prices in the fact sheet.`,
    `Source: ${contact.source}\nInterest: ${contact.interest || "(not stated)"}\nMessage: ${message || "(none)"}\nHas phone: ${Boolean(contact.phone)}; has email: ${Boolean(contact.email)}`,
    Qualification,
    600,
  );
  if (ai) return { ...ai, score: Math.max(0, Math.min(100, Math.round(ai.score))) };
  const text = `${contact.interest} ${message}`;
  let score = 45;
  if (contact.phone) score += 12;
  if (contact.email) score += 8;
  if (text.trim().length > 20) score += 10;
  if (/\b(book|schedule|appointment|estimate|quote|price|cost|how much)\b/i.test(text)) score += 12;
  const urgent = URGENT.test(text);
  if (urgent) score += 10;
  return {
    score: Math.min(score, 97),
    urgent,
    summary: contact.interest ? `Asked about ${contact.interest}.` : "New lead with no details yet.",
    estimatedValue: contact.value || 0,
  };
}

// ── Follow-Up Specialist ─────────────────────────────────────────────────────

const Reply = z.object({
  reply: z.string().describe("The text to send back. Under 320 characters for SMS. No markdown."),
  intent: z.enum(["wants_to_book", "question", "not_now", "not_interested", "complaint", "other"]),
  needsHuman: z.boolean().describe("True if the fact sheet cannot answer this, the person is upset, or they asked for a person."),
  reasonForHuman: z.string().describe("If needsHuman, one sentence on what the owner needs to do. Otherwise empty."),
});
export type DraftReply = z.infer<typeof Reply>;

export async function draftReply(
  tenant: Tenant,
  contact: Contact,
  history: { from: "customer" | "business"; text: string }[],
  inbound: string,
  channel: "sms" | "email",
): Promise<DraftReply> {
  const transcript = history
    .slice(-12)
    .map((m) => `${m.from === "customer" ? contact.firstName || "Customer" : tenant.name}: ${m.text}`)
    .join("\n");
  const ai = await ask(
    `${houseRules(tenant)}\n\nYou are the Follow-Up Specialist replying by ${channel === "sms" ? "text message" : "email"}. Your goal is to be genuinely helpful and, when it fits, move the customer toward booking with the booking link. One question at a time. Never pressure. If they say not now, be gracious and leave the door open.`,
    `Customer: ${contact.firstName} ${contact.lastName}\nOriginally asked about: ${contact.interest || "(unknown)"}\n\nConversation so far:\n${transcript || "(none)"}\n\nNew message from customer:\n${inbound}`,
    Reply,
    1200,
  );
  if (ai) return ai;

  // Rule-based fallback: acknowledge, offer the booking link, flag for a person.
  const wantsBooking = /\b(yes|book|schedule|appointment|come out|available|opening|tomorrow|today|this week)\b/i.test(inbound);
  const notNow = /\b(not now|later|maybe|next month|too expensive|no thanks|not interested)\b/i.test(inbound);
  const link = tenant.settings.bookingUrl;
  if (notNow) {
    return {
      reply: `No problem at all, ${contact.firstName || "thanks for letting us know"}. We're here whenever you're ready.`,
      intent: /not interested|no thanks/i.test(inbound) ? "not_interested" : "not_now",
      needsHuman: false,
      reasonForHuman: "",
    };
  }
  if (wantsBooking && link) {
    return {
      reply: `Great${contact.firstName ? `, ${contact.firstName}` : ""}! You can pick a time that works here: ${link} — or tell us a day and we'll set it up.`,
      intent: "wants_to_book",
      needsHuman: false,
      reasonForHuman: "",
    };
  }
  return {
    reply: `Thanks${contact.firstName ? `, ${contact.firstName}` : ""}. Someone from ${tenant.name} will get back to you shortly.`,
    intent: "question",
    needsHuman: true,
    reasonForHuman: `Answer their message: "${inbound.slice(0, 140)}"`,
  };
}

// ── Reputation Manager ───────────────────────────────────────────────────────

const ReviewReply = z.object({ response: z.string().describe("A short public reply to the review, under 60 words.") });

export async function draftReviewResponse(tenant: Tenant, firstName: string, rating: number, text: string): Promise<string> {
  const ai = await ask(
    `${houseRules(tenant)}\n\nYou are the Reputation Manager writing a public reply to a customer review. Thank them by first name. For low ratings: apologize without arguing or admitting specifics, and invite them to call the business so the owner can make it right. Never mention private details of their visit.`,
    `Reviewer: ${firstName}\nRating: ${rating} of 5\nReview: ${text || "(no text)"}`,
    ReviewReply,
    500,
  );
  if (ai) return ai.response;
  return rating >= 4
    ? `Thank you, ${firstName}! We're so glad you had a good experience with ${tenant.name}, and we appreciate you taking the time to share it.`
    : `${firstName}, thank you for the feedback, and we're sorry we fell short. Please call us at your convenience so we can make this right.`;
}

// ── Marketing team ───────────────────────────────────────────────────────────

const ContentPlan = z.object({
  posts: z.array(
    z.object({
      campaign: z.string().describe("A two-to-four word theme for the post."),
      caption: z.string().describe("Ready-to-post caption in the business's voice. No hashtags walls; at most three."),
      mediaPrompt: z.string().describe("A brief for the creative director describing the image or short video to produce."),
      platforms: z.array(z.enum(["facebook", "instagram", "tiktok", "linkedin", "gmb"])),
    }),
  ),
});
export type PlannedPost = z.infer<typeof ContentPlan>["posts"][number];

export async function planContent(tenant: Tenant, brief: string, count: number): Promise<PlannedPost[]> {
  const ai = await ask(
    `${houseRules(tenant)}\n\nYou are the Marketing Strategist and Copywriter working together. Plan ${count} social posts for the coming weeks. Mix the purposes: teach something useful, show the people behind the business, make one clear offer, and prove it with a customer result. Every claim and price must come from the fact sheet. Captions should sound like a person, not an ad.`,
    `Brief from the owner: ${brief || "A balanced month of content."}`,
    ContentPlan,
    4000,
  );
  if (ai?.posts.length) return ai.posts.slice(0, count);
  const service = (i: number) => tenant.services[i % Math.max(tenant.services.length, 1)] || "our services";
  const ideas: PlannedPost[] = [
    { campaign: "How we help", caption: `Not sure whether you need ${service(0).toLowerCase()}? Here are three signs it's time to call ${tenant.name}.`, mediaPrompt: `Clean, friendly graphic listing three signs a customer needs ${service(0).toLowerCase()}`, platforms: ["facebook", "instagram"] },
    { campaign: "Meet the team", caption: `The people behind ${tenant.name}: say hello to the crew who'll take care of you.`, mediaPrompt: "Candid, warm team photo at the place of business", platforms: ["facebook", "instagram"] },
    { campaign: "Easy booking", caption: `Booking with ${tenant.name} takes about a minute. ${tenant.settings.bookingUrl}`, mediaPrompt: "Phone on a table showing a simple booking screen, soft daylight", platforms: ["facebook", "instagram", "gmb"] },
    { campaign: "Customer story", caption: `"They followed up right away and got me in the same week." Thank you for trusting us.`, mediaPrompt: "Quote card with the review text on the brand color", platforms: ["facebook", "instagram"] },
  ];
  return Array.from({ length: count }, (_, i) => ideas[i % ideas.length]);
}
