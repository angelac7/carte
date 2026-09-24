import "server-only";
import type { LanguageCode } from "@/lib/languages";
import { sourceHash } from "@/lib/source-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { DishInsightSchema, type DishInsight } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

/** A saved explanation, or null if there isn't one or the dish has changed since. */
export async function getCachedInsight(
  dish: MenuItem,
  language: LanguageCode,
): Promise<DishInsight | null> {
  const { data, error } = await createAdminClient()
    .from("dish_insights")
    .select("source_hash, insight")
    .eq("menu_item_id", dish.id)
    .eq("language", language)
    .maybeSingle();
  if (error) throw error;

  const row = data as { source_hash: string; insight: unknown } | null;
  if (!row || row.source_hash !== sourceHash(dish)) return null;
  const parsed = DishInsightSchema.safeParse(row.insight);
  return parsed.success ? parsed.data : null;
}

export async function saveInsight(
  dish: MenuItem,
  language: LanguageCode,
  insight: DishInsight,
): Promise<void> {
  const { error } = await createAdminClient()
    .from("dish_insights")
    .upsert(
      { menu_item_id: dish.id, language, source_hash: sourceHash(dish), insight },
      { onConflict: "menu_item_id,language" },
    );
  if (error) throw error;
}
