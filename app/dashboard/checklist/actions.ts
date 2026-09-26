"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { reviewDishAgain } from "@/lib/db/menu-review";
import { isLanguageCode } from "@/lib/languages";
import { reportError } from "@/lib/report-error";

export async function recordReview(form: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/checklist");
  const parsed = z
    .object({
      dish: z.uuid(),
      revision: z.coerce.number().int().positive(),
      checked: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  const lang = String(form.get("lang") ?? "en");
  let saved = false;
  if (parsed.success) {
    try {
      await reviewDishAgain(supabase, restaurant.id, parsed.data.dish, parsed.data.revision);
      saved = true;
    } catch (error) {
      reportError("Dish re-review failed", error);
    }
  }
  if (saved) {
    revalidatePath("/dashboard/checklist");
    revalidatePath("/dashboard/history");
    revalidatePath("/dashboard/review");
  }
  redirect(
    `/dashboard/checklist?lang=${isLanguageCode(lang) ? lang : "en"}&${saved ? "saved" : "failed"}=1`,
  );
}
