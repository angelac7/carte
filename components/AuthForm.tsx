"use client";
import Link from "@/components/OfflineLink";
import { useActionState } from "react";
import { logIn, signUp, type AuthState } from "@/app/auth/actions";
import { BlurFade } from "@/components/motion/BlurFade";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
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

const inputClass = fieldClass("mt-2");

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  /** The page to return to afterward. Without one, login goes home and signup to setup. */
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? logIn : signUp,
    {},
  );
  const copy = COPY[mode];

  return (
    <main id="main" className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <BlurFade>
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-7xl">
          {copy.title}
        </h1>
      </BlurFade>
      <form
        action={formAction}
        className="mt-10 space-y-5 rounded-panel bg-paper p-6 shadow-raised-lg sm:p-8"
      >
        {next && <input type="hidden" name="next" value={next} />}
        <label className="block">
          <span className="eyebrow text-muted">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="eyebrow text-muted">Password</span>
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
      {mode === "signup" && (
        <p className="mt-4 text-sm text-muted">
          By creating an account, you agree to the{" "}
          <Link href="/terms" className="text-ink underline underline-offset-4">
            terms of use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      )}
      {mode === "login" && (
        <Link href="/forgot-password" className="mt-4 inline-block text-sm underline">
          Forgot your password?
        </Link>
      )}
      <p className="mt-6 text-sm text-muted">
        {copy.switchText}{" "}
        <Link
          href={next ? `${copy.switchHref}?next=${encodeURIComponent(next)}` : copy.switchHref}
          className="text-ink underline underline-offset-4 hover:text-muted"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </main>
  );
}
