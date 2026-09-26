"use client";
import { useActionState } from "react";
import Link from "@/components/OfflineLink";
import { requestPasswordReset, resetPassword, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useOwnerText } from "@/components/owner/OwnerLanguage";

export function PasswordForm({
  mode,
  expired = false,
}: {
  mode: "request" | "reset";
  expired?: boolean;
}) {
  const { t } = useOwnerText();
  const a = t.auth;
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "request" ? requestPasswordReset : resetPassword,
    {},
  );
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-4xl">{mode === "request" ? a.resetTitle : a.chooseTitle}</h1>
      {expired && (
        <Notice tone="warning" className="mt-4">
          {a.expired}
        </Notice>
      )}
      <form action={action} className="mt-8 space-y-5">
        {mode === "request" ? (
          <label className="block">
            {a.email}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass("mt-2")}
            />
          </label>
        ) : (
          <>
            <label className="block">
              {a.newPassword}
              <input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                className={fieldClass("mt-2")}
              />
            </label>
            <label className="block">
              {a.confirmPassword}
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                className={fieldClass("mt-2")}
              />
            </label>
          </>
        )}
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
        <Button type="submit" disabled={pending}>
          {pending ? a.oneMoment : mode === "request" ? a.sendLink : a.saveNew}
        </Button>
      </form>
      <Link
        className="mt-6 inline-block text-sm underline"
        href={mode === "request" ? "/login" : "/forgot-password"}
      >
        {mode === "request" ? a.backToLogin : a.requestAnother}
      </Link>
    </main>
  );
}
