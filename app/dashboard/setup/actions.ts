"use server";
import { safeNextPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { RESTAURANT_COOKIE, requireUser } from "@/lib/auth";
import { createRestaurant, listMyRestaurants } from "@/lib/db";
import { fmt } from "@/lib/i18n/owner/format";
import { ownerStrings } from "@/lib/owner-language";
import { isValidSlug, slugify } from "@/lib/slug";

/** Enough for a small group of restaurants, while stopping runaway sign-ups. */
const MAX_LOCATIONS = 10;

export type SetupState = { error?: string };

export async function createRestaurantAction(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const { supabase, user } = await requireUser();
  const { t } = await ownerStrings();
  const name = String(formData.get("name") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase() || slugify(name);

  if (!name || name.length > 120) return { error: t.setup.errorName };
  if (!isValidSlug(slug)) {
    return { error: t.setup.errorLink };
  }

  const owned = (await listMyRestaurants(supabase, user.id)).filter((r) => r.role === "owner");
  if (owned.length >= MAX_LOCATIONS) {
    return { error: fmt(t.setup.errorLimit, { max: MAX_LOCATIONS }) };
  }

  const result = await createRestaurant(supabase, user.id, name, slug);
  if (!result.ok) {
    return {
      error: result.reason === "taken" ? t.setup.errorTaken : t.setup.errorSave,
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
