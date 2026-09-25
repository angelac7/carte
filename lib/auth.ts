import "server-only";
import { safeNextPath } from "@/lib/safe-redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/** For owner pages: sends signed-out visitors to the login page. */
export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNextPath(next))}`);
  return { supabase, user };
}

/** For owner pages that need a restaurant: sends new owners to setup first. */
export async function requireRestaurant(next = "/dashboard") {
  const { supabase, user } = await requireUser(next);
  const restaurant = await getOwnerRestaurant(supabase, user.id);
  if (!restaurant) redirect(`/dashboard/setup?next=${encodeURIComponent(safeNextPath(next))}`);
  return { supabase, user, restaurant };
}

/** For API routes: returns null instead of redirecting, so the route can answer 401. */
export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const restaurant = await getOwnerRestaurant(supabase, user.id);
  if (!restaurant) return null;
  return { supabase, user, restaurant };
}

/** For the landing, login, and signup pages: signed-in owners go straight to the dashboard. */
export async function redirectIfSignedIn(next = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(safeNextPath(next));
}

/**
 * Whether this visitor has a login session cookie. Only used to choose header buttons, so it
 * skips a network check; anything that needs the account still verifies it with requireUser.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return store.getAll().some((cookie) => /^sb-.+-auth-token(\.\d+)?$/.test(cookie.name));
}

/**
 * Whether the header should show Log out and Dashboard. Visitors without a session cookie
 * skip the network check, so public pages stay fast.
 */
export async function isSignedIn(): Promise<boolean> {
  if (!(await hasSessionCookie())) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user !== null;
}
