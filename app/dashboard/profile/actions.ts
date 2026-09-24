"use server";
import { requireRestaurant } from "@/lib/auth";
import { updateRestaurantProfile } from "@/lib/db/profile";
import { ProfileSchema, WEEKDAYS } from "@/lib/restaurant-profile";

export type ProfileState = { error?: string; saved?: boolean };

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
  const parsed = ProfileSchema.safeParse({
    listed: formData.get("listed") === "on",
    description: String(formData.get("description") ?? ""),
    cuisine: String(formData.get("cuisine") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    hours: readHours(formData),
    occasions: formData.getAll("occasion").map(String),
  });
  if (!parsed.success) {
    return {
      error:
        "Check your hours: each open day needs an opening and closing time, or mark it closed.",
    };
  }
  await updateRestaurantProfile(supabase, restaurant.id, parsed.data);
  return { saved: true };
}
