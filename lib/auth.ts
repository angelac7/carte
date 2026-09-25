import "server-only";
import { safeNextPath } from "@/lib/safe-redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listMyRestaurants, type Restaurant } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** For owner pages: sends signed-out visitors to the login page. */
export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNextPath(next))}`);
  return { supabase, user };
}

/** Remembers which restaurant a person with several locations is working on. */
export const RESTAURANT_COOKIE = "carte-restaurant";

/**
 * The restaurant a signed-in person is working on: the one they picked, or else their first.
 * Also returns every restaurant they can work on, for switching.
 */
export async function currentRestaurant(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ restaurant: Restaurant | null; all: Restaurant[] }> {
  const all = await listMyRestaurants(supabase, userId);
  const chosen = (await cookies()).get(RESTAURANT_COOKIE)?.value;
  return { restaurant: all.find((r) => r.id === chosen) ?? all[0] ?? null, all };
}

/** For owner pages that need a restaurant: sends new owners to setup first. */
export async function requireRestaurant(next = "/dashboard") {
  const { supabase, user } = await requireUser(next);
  const { restaurant } = await currentRestaurant(supabase, user.id);
  if (!restaurant) redirect(`/dashboard/setup?next=${encodeURIComponent(safeNextPath(next))}`);
  return { supabase, user, restaurant };
}

/** For pages only the owner may use, like the team and the map listing. Editors go back home. */
export async function requireOwnedRestaurant(next = "/dashboard") {
  const context = await requireRestaurant(next);
  if (context.restaurant.role !== "owner") redirect("/dashboard");
  return context;
}

/** For API routes: returns null instead of redirecting, so the route can answer 401. */
export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { restaurant } = await currentRestaurant(supabase, user.id);
  if (!restaurant) return null;
  return { supabase, user, restaurant };
}

/** For the login and signup pages: signed-in visitors go home, or to the page they asked for. */
export async function redirectIfSignedIn(next = "/") {
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
