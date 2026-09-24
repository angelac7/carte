import "server-only";
import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/** For owner pages: sends signed-out visitors to the login page. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** For owner pages that need a restaurant: sends new owners to setup first. */
export async function requireRestaurant() {
  const { supabase, user } = await requireUser();
  const restaurant = await getOwnerRestaurant(supabase, user.id);
  if (!restaurant) redirect("/dashboard/setup");
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
export async function redirectIfSignedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
}
