import { redirect } from "next/navigation";
import { SignInForm } from "@/components/client";
import { signIn } from "@/lib/actions";
import { isSignedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isSignedIn()) redirect("/app");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <p className="mb-6 mt-2 text-muted">Enter the workspace password to open the dashboard.</p>
      <SignInForm action={signIn} />
    </main>
  );
}
