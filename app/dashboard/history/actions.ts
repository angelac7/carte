"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { restoreDishVersion } from "@/lib/db/dish-history";

const Id = z.coerce.number().int().positive();

/** Puts a dish's allergens back to an earlier version; the dish then needs confirming again. */
export async function restoreVersionAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/history");
  const entry = Id.safeParse(formData.get("entry"));
  const latest = Id.safeParse(formData.get("latest"));
  const result =
    entry.success && latest.success
      ? await restoreDishVersion(supabase, restaurant.id, entry.data, latest.data)
      : "missing";
  redirect(`/dashboard/history?result=${result}`);
}
