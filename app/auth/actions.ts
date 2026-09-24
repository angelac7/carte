"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const Credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

const INVALID = "Enter a valid email and a password of at least 8 characters.";

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: INVALID };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password don't match an account." };
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: INVALID };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard/setup` },
  });
  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "An account with that email already exists. Log in instead."
          : "Your account couldn't be created. Try again.",
    };
  }
  if (!data.session) return { message: "Check your email for a confirmation link, then log in." };
  redirect("/dashboard/setup");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
