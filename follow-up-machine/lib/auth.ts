import { cookies } from "next/headers";

// A single shared workspace password, for the MVP. When APP_PASSWORD is unset
// the app is open (demo mode). Per-user logins and per-client seats are on the
// v2 roadmap (Supabase Auth).

export const SESSION_COOKIE = "fum_session";

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`follow-up-machine:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isSignedIn(): Promise<boolean> {
  if (!authEnabled()) return true;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(token) && token === (await sessionToken(process.env.APP_PASSWORD!));
}

export async function requireSession(): Promise<void> {
  if (!(await isSignedIn())) throw new Error("Sign in to continue.");
}

/** Shared-secret check for machine callers (cron, provisioning script, webhooks). */
export function hasValidSecret(request: Request, envName: string): boolean {
  const secret = process.env[envName];
  if (!secret) return process.env.NODE_ENV !== "production";
  const url = new URL(request.url);
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";
  return given === secret;
}
