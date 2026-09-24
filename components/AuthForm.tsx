"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp, type AuthState } from "@/app/auth/actions";

const COPY = {
  login: {
    title: "Log in",
    submit: "Log in",
    switchText: "New to Carte?",
    switchHref: "/signup",
    switchLabel: "Create an account",
  },
  signup: {
    title: "Create your account",
    submit: "Create account",
    switchText: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Log in",
  },
} as const;

const inputClass =
  "mt-1 w-full rounded-md border border-line bg-card px-3 py-2 focus:border-ink focus:outline-none";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? logIn : signUp,
    {},
  );
  const copy = COPY[mode];

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-4xl leading-tight">{copy.title}</h1>
      <form action={formAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {mode === "signup" && (
            <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>
          )}
        </label>

        {state.error && (
          <p role="alert" className="rounded-md bg-tomato/10 px-3 py-2 text-sm text-tomato">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-md bg-basil-soft px-3 py-2 text-sm text-basil">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
        >
          {pending ? "One moment…" : copy.submit}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="text-ink underline">
          {copy.switchLabel}
        </Link>
      </p>
    </main>
  );
}
