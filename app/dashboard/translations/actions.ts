"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { saveCorrectedTranslation } from "@/lib/db/owner-translations";
import { isLanguageCode } from "@/lib/languages";
import { translationComplete } from "@/lib/publish-checklist";
import { reportError } from "@/lib/report-error";
import { optionLabels, translationHash } from "@/lib/source-hash";

const Text = z.string().trim().max(2000);

/** Saves a team's corrected translation of one dish. Every part the original has must be filled. */
export async function saveTranslationAction(formData: FormData): Promise<void> {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/translations");
  const language = String(formData.get("lang") ?? "");
  const dishId = z.uuid().safeParse(formData.get("dish"));
  const back = (result: string) =>
    redirect(
      `/dashboard/translations?lang=${isLanguageCode(language) ? language : "en"}&${result}` +
        (dishId.success ? `#dish-${dishId.data}` : ""),
    );
  if (!isLanguageCode(language) || !dishId.success) back("failed=1");

  const dish = (await listDishes(supabase, restaurant.id)).find((d) => d.id === dishId.data);
  const text = z
    .object({
      name: Text,
      description: Text,
      notes: Text,
      section: Text.max(80),
      options: z.array(Text.max(60)).max(20),
    })
    .safeParse({
      name: formData.get("name") ?? "",
      description: formData.get("description") ?? "",
      notes: formData.get("notes") ?? "",
      section: formData.get("section") ?? "",
      options: formData.getAll("option"),
    });
  if (!dish || !text.success) back("failed=1");
  const saved = { menu_item_id: dish!.id, source_hash: translationHash(dish!), ...text.data! };
  if (!translationComplete(dish!, saved) || saved.options.length !== optionLabels(dish!).length)
    back(`incomplete=${dish!.id}`);

  try {
    await saveCorrectedTranslation(
      supabase,
      dish!.id,
      language as Parameters<typeof saveCorrectedTranslation>[2],
      saved.source_hash,
      text.data!,
    );
  } catch (error) {
    reportError("Saving a corrected translation failed", error);
    back("failed=1");
  }
  revalidatePath("/dashboard/translations");
  back(`saved=${dish!.id}`);
}
