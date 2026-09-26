"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteAccount, passwordMatches } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { listMyRestaurants } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";

export type AccountState = { error?: string; message?: string };

const Password = z.string().min(8).max(72);
const WRONG_PASSWORD = "Your current password isn't right.";
const TOO_MANY = "Too many attempts. Try again in 15 minutes.";

/** Confirms the signed-in owner's current password, a few tries at a time. */
async function confirmOwner(formData: FormData) {
  const { supabase, user } = await requireUser("/dashboard/account");
  const current = String(formData.get("currentPassword") ?? "");
  if (!(await checkRateLimit(`account-password:${user.id}`, 5, 15 * 60 * 1000))) {
    return { error: TOO_MANY } as const;
  }
  if (!user.email || !(await passwordMatches(user.email, current))) {
    return { error: WRONG_PASSWORD } as const;
  }
  return { supabase, user } as const;
}

export async function changeEmailAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: "Enter a valid email address." };
  const owner = await confirmOwner(formData);
  if ("error" in owner) return { error: owner.error };
  if (email.data.toLowerCase() === owner.user.email?.toLowerCase()) {
    return { error: "That's already your email." };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await owner.supabase.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: `${origin}/auth/callback?next=/dashboard/account` },
  );
  if (error) return { error: "Your email couldn't be changed. Try again later." };
  return {
    message: `We sent a confirmation link to ${email.data}. Your email changes once you open it. If one arrives at your current address too, open that as well.`,
  };
}

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const password = Password.safeParse(formData.get("newPassword"));
  if (!password.success) return { error: "Use a new password between 8 and 72 characters." };
  if (password.data !== formData.get("confirmPassword")) {
    return { error: "The new passwords don't match." };
  }
  const owner = await confirmOwner(formData);
  if ("error" in owner) return { error: owner.error };

  const { error } = await owner.supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "Your password couldn't be changed. Try a different one." };
  return { message: "Your password has been changed." };
}

export async function deleteAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
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
    return { error: "Your account couldn't be deleted. Please try again." };
  }
  // The login no longer exists; clear this browser's session cookies too.
  await owner.supabase.auth.signOut().catch(() => {});
  redirect("/goodbye");
}
