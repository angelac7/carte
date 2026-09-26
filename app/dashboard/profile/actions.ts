"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/auth";
import { updateRestaurantProfile } from "@/lib/db/profile";
import { ProfileSchema, WEEKDAYS, withWebScheme } from "@/lib/restaurant-profile";
import { ownerStrings } from "@/lib/owner-language";

export type ProfileState = { error?: string; saved?: boolean; revision?: number };

function readHours(formData: FormData) {
  return Object.fromEntries(
    WEEKDAYS.map((day) => {
      if (formData.get(`${day}-closed`) === "on") return [day, null];
      return [
        day,
        {
          open: String(formData.get(`${day}-open`) ?? ""),
          close: String(formData.get(`${day}-close`) ?? ""),
        },
      ];
    }),
  );
}

export async function saveProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { supabase, restaurant } = await requireRestaurant();
  const { t } = await ownerStrings();
  const parsed = ProfileSchema.extend({ revision: z.number().int().positive() }).safeParse({
    revision: Number(formData.get("revision")),
    name: String(formData.get("name") ?? ""),
    listed: formData.get("listed") === "on",
    description: String(formData.get("description") ?? ""),
    cuisine: String(formData.get("cuisine") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    hours: readHours(formData),
    occasions: formData.getAll("occasion").map(String),
    phone: String(formData.get("phone") ?? ""),
    website: withWebScheme(String(formData.get("website") ?? "")),
    reservation_url: withWebScheme(String(formData.get("reservation_url") ?? "")),
    price_range: Number(formData.get("price_range") ?? 0),
    kitchen_practices: formData.getAll("kitchen_practice").map(String),
    features: formData.getAll("feature").map(String),
    currency: String(formData.get("currency") ?? ""),
  });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      revision: _prev.revision,
      error:
        field === "website"
          ? t.profile.errorWebsite
          : field === "reservation_url"
            ? t.profile.errorReservation
            : field === "hours"
              ? t.profile.errorHours
              : t.profile.errorForm,
    };
  }
  if (!parsed.data.name) {
    return { revision: parsed.data.revision, error: t.profile.errorName };
  }
  let revision: number | null;
  try {
    revision = await updateRestaurantProfile(supabase, restaurant.id, parsed.data);
    if (!revision)
      return {
        revision: parsed.data.revision,
        error: t.profile.errorConflict,
      };
  } catch {
    return {
      revision: parsed.data.revision,
      error: t.profile.errorSave,
    };
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/discover");
  return { saved: true, revision };
}
