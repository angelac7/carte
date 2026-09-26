"use client";
import { useActionState, type ReactNode } from "react";
import {
  changeEmailAction,
  changePasswordAction,
  deleteAccountAction,
  type AccountState,
} from "@/app/dashboard/account/actions";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { fmt } from "@/lib/i18n/owner/format";

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";
const inputClass = fieldClass("mt-2");

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      {children}
    </label>
  );
}

function CurrentPassword() {
  const { t } = useOwnerText();
  return (
    <Field label={t.account.currentPassword}>
      <input
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
        className={inputClass}
      />
    </Field>
  );
}

function Result({ state }: { state: AccountState }) {
  if (state.error)
    return (
      <Notice tone="warning" role="alert">
        {state.error}
      </Notice>
    );
  if (state.message)
    return (
      <Notice tone="success" role="status">
        {state.message}
      </Notice>
    );
  return null;
}

/** Email, password, and account deletion. Each change asks for the current password. */
export function AccountSettings({ email }: { email: string }) {
  const { t } = useOwnerText();
  const a = t.account;
  const [emailState, emailAction, emailPending] = useActionState(changeEmailAction, {});
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, {});

  return (
    <>
      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{a.email}</h2>
        <p className="mt-1 text-sm text-muted">{fmt(a.loggedInAs, { email })}</p>
        <form action={emailAction} className="mt-6 space-y-5">
          <Field label={a.newEmail}>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </Field>
          <CurrentPassword />
          <Result state={emailState} />
          <Button type="submit" disabled={emailPending}>
            {emailPending ? a.oneMoment : a.changeEmail}
          </Button>
        </form>
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{a.password}</h2>
        <form action={passwordAction} className="mt-6 space-y-5">
          <CurrentPassword />
          <Field label={a.newPassword}>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-muted">{a.passwordHint}</span>
          </Field>
          <Field label={a.newPasswordAgain}>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Result state={passwordState} />
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? a.oneMoment : a.changePassword}
          </Button>
        </form>
      </section>

      <section className={cn(panelClass, "border border-tomato/40")}>
        <h2 className="font-serif text-3xl tracking-tight">{a.deleteTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{a.deleteText}</p>
        <form action={deleteAction} className="mt-6 space-y-5">
          <Field label={a.typeDelete}>
            <input
              name="confirm"
              required
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <CurrentPassword />
          <Result state={deleteState} />
          <Button type="submit" className="bg-tomato" disabled={deletePending}>
            {deletePending ? a.deleting : a.deleteButton}
          </Button>
        </form>
      </section>
    </>
  );
}
