"use server";
import { safeNextPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { RESTAURANT_COOKIE, requireUser } from "@/lib/auth";
import { createRestaurant, listMyRestaurants } from "@/lib/db";

/** Enough for a small group of restaurants, while stopping runaway sign-ups. */
const MAX_LOCATIONS = 10;
import { isValidSlug, slugify } from "@/lib/slug";

export type SetupState = { error?: string };

export async function createRestaurantAction(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase() || slugify(name);

  if (!name || name.length > 120) return { error: "Enter your restaurant's name." };
  if (!isValidSlug(slug)) {
    return { error: "Menu links use 3 to 40 lowercase letters, numbers, and single dashes." };
  }

  const owned = (await listMyRestaurants(supabase, user.id)).filter((r) => r.role === "owner");
  if (owned.length >= MAX_LOCATIONS) {
    return { error: `You can have up to ${MAX_LOCATIONS} locations. Contact Carte for more.` };
  }

  const result = await createRestaurant(supabase, user.id, name, slug);
  if (!result.ok) {
    return {
      error:
        result.reason === "taken"
          ? "That menu link is already taken. Try another one."
          : "Your restaurant couldn't be saved. Try again.",
    };
  }
  // Work on the new location straight away.
  (await cookies()).set(RESTAURANT_COOKIE, result.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}
