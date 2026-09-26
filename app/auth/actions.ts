"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginErrorMessage, authErrorDiagnostic, signupErrorMessage } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/safe-redirect";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { ownerStrings } from "@/lib/owner-language";

export type AuthState = { error?: string; message?: string };

const Credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { t } = await ownerStrings();
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t.auth.invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.error("Login failed:", authErrorDiagnostic(error));
    return { error: loginErrorMessage(error, t.auth.loginErrors) };
  }
  // Home, like everyone else, unless they were sent here from a particular page.
  redirect(safeNextPath(formData.get("next"), "/"));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { t } = await ownerStrings();
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t.auth.invalid };

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("Signup failed:", authErrorDiagnostic(error));
    return { error: signupErrorMessage(error, t.auth.signupErrors) };
  }
  if (!data.session) return { message: t.auth.checkEmail };
  redirect(`/dashboard/setup?next=${encodeURIComponent(next)}`);
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { t } = await ownerStrings();
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { error: t.auth.invalidEmail };
  const requestHeaders = await headers();
  if (
    !(await checkRateLimit(
      `password-reset:${clientKeyFromHeaders(requestHeaders)}`,
      5,
      60 * 60 * 1000,
    ))
  ) {
    return { error: t.auth.tooManyResets };
  }
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: t.auth.resetFailed };
  return { message: t.auth.resetSent };
}

export async function resetPassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const { t } = await ownerStrings();
  const password = z.string().min(8).max(72).safeParse(formData.get("password"));
  if (!password.success) return { error: t.auth.passwordLength };
  if (password.data !== formData.get("confirmPassword")) return { error: t.auth.mismatch };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.linkExpired };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: t.auth.updateFailed };
  redirect("/");
}
