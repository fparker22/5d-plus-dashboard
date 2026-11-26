// Creates (or updates) the ElevenLabs phone attendant for one business, using
// the prompt, greeting, data-collection fields and evaluation criteria defined
// in lib/agents.ts — so the repo stays the source of truth for what callers hear.
//
//   ELEVENLABS_API_KEY=... npx tsx scripts/sync-voice-agent.ts <business-slug> [voice_id]
//
// Prints the agent ID. Paste it into the business's Settings → Linked accounts,
// then attach the agent to the business's phone number in ElevenLabs.
import { CALL_DATA_FIELDS, CALL_EVALUATION, receptionistFirstMessage, receptionistPrompt } from "../lib/agents";
import { db } from "../lib/store";

async function main() {
  const [slug, voiceId] = process.argv.slice(2);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!slug || !key) {
    console.error("Usage: ELEVENLABS_API_KEY=... npx tsx scripts/sync-voice-agent.ts <business-slug> [voice_id]");
    process.exit(1);
  }
  const [tenant] = await db().list("tenants", { slug });
  if (!tenant) throw new Error(`No business with slug "${slug}".`);

  const body = {
    name: `${tenant.name} — Phone Attendant`,
    conversation_config: {
      agent: {
        first_message: receptionistFirstMessage(tenant),
        language: "en",
        prompt: { prompt: receptionistPrompt(tenant) },
      },
      ...(voiceId ? { tts: { voice_id: voiceId } } : {}),
    },
    platform_settings: {
      data_collection: Object.fromEntries(Object.entries(CALL_DATA_FIELDS).map(([name, f]) => [name, { type: f.type, description: f.description }])),
      evaluation: {
        criteria: CALL_EVALUATION.map((c) => ({ id: c.id, name: c.name, type: "prompt", conversation_goal_prompt: c.prompt })),
      },
    },
  };

  const existing = tenant.settings.voiceAgentId;
  const url = existing ? `https://api.elevenlabs.io/v1/convai/agents/${existing}` : "https://api.elevenlabs.io/v1/convai/agents/create";
  const res = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs returned ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const json = (await res.json()) as { agent_id?: string };
  const agentId = json.agent_id ?? existing;
  if (!existing && agentId) await db().update("tenants", tenant.id, { settings: { ...tenant.settings, voiceAgentId: agentId } });
  console.log(`${existing ? "Updated" : "Created"} phone attendant for ${tenant.name}: ${agentId}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
