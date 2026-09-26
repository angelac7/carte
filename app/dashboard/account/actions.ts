"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteAccount, passwordMatches } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { listMyRestaurants } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";
import { fmt } from "@/lib/i18n/owner/format";
import { ownerStrings } from "@/lib/owner-language";

export type AccountState = { error?: string; message?: string };

const Password = z.string().min(8).max(72);

/** Confirms the signed-in owner's current password, a few tries at a time. */
async function confirmOwner(formData: FormData) {
  const { supabase, user } = await requireUser("/dashboard/account");
  const current = String(formData.get("currentPassword") ?? "");
  const { t } = await ownerStrings();
  if (!(await checkRateLimit(`account-password:${user.id}`, 5, 15 * 60 * 1000))) {
    return { error: t.account.tooMany } as const;
  }
  if (!user.email || !(await passwordMatches(user.email, current))) {
    return { error: t.account.wrongPassword } as const;
  }
  return { supabase, user } as const;
}

export async function changeEmailAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const { t } = await ownerStrings();
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: t.account.invalidEmail };
  const owner = await confirmOwner(formData);
  if ("error" in owner) return { error: owner.error };
  if (email.data.toLowerCase() === owner.user.email?.toLowerCase()) {
    return { error: t.account.sameEmail };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await owner.supabase.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: `${origin}/auth/callback?next=/dashboard/account` },
  );
  if (error) return { error: t.account.emailFailed };
  return {
    message: fmt(t.account.emailSent, { email: email.data }),
  };
}

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const { t } = await ownerStrings();
  const password = Password.safeParse(formData.get("newPassword"));
  if (!password.success) return { error: t.account.passwordLength };
  if (password.data !== formData.get("confirmPassword")) {
    return { error: t.account.passwordMismatch };
  }
  const owner = await confirmOwner(formData);
  if ("error" in owner) return { error: owner.error };

  const { error } = await owner.supabase.auth.updateUser({ password: password.data });
  if (error) return { error: t.account.passwordFailed };
  return { message: t.account.passwordChanged };
}

export async function deleteAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: (await ownerStrings()).t.account.confirmDelete };
  }
  const owner = await confirmOwner(formData);
  if ("error" in owner) return { error: owner.error };

  try {
    const owned = (await listMyRestaurants(owner.supabase, owner.user.id)).filter(
      (restaurant) => restaurant.role === "owner",
    );
    await deleteAccount(
      owner.user.id,
      owned.map((restaurant) => restaurant.id),
    );
  } catch (err) {
    reportError("Account deletion failed", err);
    return { error: (await ownerStrings()).t.account.deleteFailed };
  }
  // The login no longer exists; clear this browser's session cookies too.
  await owner.supabase.auth.signOut().catch(() => {});
  redirect("/goodbye");
}
