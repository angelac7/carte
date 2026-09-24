"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp, type AuthState } from "@/app/auth/actions";
import { BlurFade } from "@/components/motion/BlurFade";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

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

const inputClass = fieldClass("mt-1 text-base");

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? logIn : signUp,
    {},
  );
  const copy = COPY[mode];

  return (
    <main id="main" className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <BlurFade>
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
      </BlurFade>
      <form
        action={formAction}
        className="mt-8 space-y-4 rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6"
      >
        <label className="block">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Password</span>
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
          <Notice tone="warning" role="alert">
            {state.error}
          </Notice>
        )}
        {state.message && (
          <Notice tone="success" role="status">
            {state.message}
          </Notice>
        )}

        <Button type="submit" disabled={pending} size="lg" shine className="w-full">
          {pending ? "One moment…" : copy.submit}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {copy.switchText}{" "}
        <Link
          href={copy.switchHref}
          className="text-ink underline underline-offset-4 hover:text-muted"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </main>
  );
}
