"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { resolveReport } from "@/lib/db/reports";

/** Marks a diner's report as dealt with, so it leaves the dashboard. */
export async function resolveReportAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await resolveReport(supabase, restaurant.id, id.data);
  revalidatePath("/dashboard");
}
