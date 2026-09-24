"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/auth";
import { updateRestaurantProfile } from "@/lib/db/profile";
import { ProfileSchema, WEEKDAYS } from "@/lib/restaurant-profile";

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
  const parsed = ProfileSchema.extend({ revision: z.number().int().positive() }).safeParse({
    revision: Number(formData.get("revision")),
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
      revision: _prev.revision,
      error:
        "Check your hours: each open day needs an opening and closing time, or mark it closed.",
    };
  }
  let revision: number | null;
  try {
    revision = await updateRestaurantProfile(supabase, restaurant.id, parsed.data);
    if (!revision)
      return {
        revision: parsed.data.revision,
        error: "Your profile changed in another tab. Reload and review it before saving again.",
      };
  } catch {
    return {
      revision: parsed.data.revision,
      error: "Your profile could not be saved. Please try again.",
    };
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/discover");
  return { saved: true, revision };
}
