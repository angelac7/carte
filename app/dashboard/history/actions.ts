"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { restoreDishVersion } from "@/lib/db/dish-history";

/** Puts a dish's allergens back to an earlier version; the dish then needs confirming again. */
export async function restoreVersionAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/history");
  const entry = z.coerce.number().int().positive().safeParse(formData.get("entry"));
  const restored = entry.success && (await restoreDishVersion(supabase, restaurant.id, entry.data));
  redirect(`/dashboard/history?${restored ? "restored=1" : "failed=1"}`);
}
