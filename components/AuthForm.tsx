"use client";
import Link from "@/components/OfflineLink";
import { useActionState } from "react";
import { logIn, signUp, type AuthState } from "@/app/auth/actions";
import { BlurFade } from "@/components/motion/BlurFade";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useOwnerText } from "@/components/owner/OwnerLanguage";

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
  const { t } = useOwnerText();
  const a = t.auth;
  const copy =
    mode === "login"
      ? {
          title: a.loginTitle,
          submit: a.loginSubmit,
          switchText: a.loginSwitchText,
          switchHref: "/signup",
          switchLabel: a.loginSwitchLabel,
        }
      : {
          title: a.signupTitle,
          submit: a.signupSubmit,
          switchText: a.signupSwitchText,
          switchHref: "/login",
          switchLabel: a.signupSwitchLabel,
        };
  const [agreeBefore, agreeRest = ""] = a.agree.split("{terms}");
  const [agreeMiddle, agreeAfter = ""] = agreeRest.split("{privacy}");

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
          <span className="eyebrow text-muted">{a.email}</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="eyebrow text-muted">{a.password}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {mode === "signup" && (
            <span className="mt-1 block text-xs text-muted">{a.passwordHint}</span>
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
          {pending ? a.oneMoment : copy.submit}
        </Button>
      </form>
      {mode === "signup" && (
        <p className="mt-4 text-sm text-muted">
          {agreeBefore}
          <Link href="/terms" className="text-ink underline underline-offset-4">
            {a.terms}
          </Link>
          {agreeMiddle}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            {a.privacy}
          </Link>
          {agreeAfter}
        </p>
      )}
      {mode === "login" && (
        <Link href="/forgot-password" className="mt-4 inline-block text-sm underline">
          {a.forgot}
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
