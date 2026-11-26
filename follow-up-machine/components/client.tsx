"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";

/** A select that submits its form as soon as the choice changes. */
export function AutoSelect({
  name,
  defaultValue,
  options,
  label,
  className = "",
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`rounded-md border border-line bg-paper px-2 py-1.5 text-sm ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Submit button that shows it is working and prevents double sends. */
export function Submit({ children, className = "btn-primary", busy = "Working…" }: { children: React.ReactNode; className?: string; busy?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? busy : children}
    </button>
  );
}

/** A form that clears itself after its action finishes. */
export function ResetForm({ action, children, className }: { action: (form: FormData) => Promise<void>; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (form) => {
        await action(form);
        ref.current?.reset();
      }}
    >
      {children}
    </form>
  );
}

export function SignInForm({ action }: { action: (state: { error: string }, form: FormData) => Promise<{ error: string }> }) {
  const [state, formAction] = useActionState(action, { error: "" });
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">
          Workspace password
        </label>
        <input id="password" name="password" type="password" required autoFocus className="input" />
        {state.error && <p className="mt-2 text-sm text-alert">{state.error}</p>}
      </div>
      <Submit busy="Signing in…">Sign in</Submit>
    </form>
  );
}
