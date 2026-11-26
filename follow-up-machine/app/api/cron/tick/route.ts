import { hasValidSecret } from "@/lib/auth";
import { tick } from "@/lib/engine";

// The heartbeat. Have a scheduler hit this every 5 minutes:
//   GET /api/cron/tick   with header  Authorization: Bearer $CRON_SECRET
// It sends every sequence step that has fallen due, for every business.
export const maxDuration = 60;

async function run(request: Request) {
  if (!hasValidSecret(request, "CRON_SECRET")) return new Response("Unauthorized", { status: 401 });
  return Response.json({ ok: true, ...(await tick()) });
}

export const GET = run;
export const POST = run;
