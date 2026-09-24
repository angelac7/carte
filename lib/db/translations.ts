import "server-only";
import type { LanguageCode } from "@/lib/languages";
import { sourceHash } from "@/lib/source-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MenuItem } from "@/types/menu";
import type { DishTranslation, MenuTranslations } from "@/types/translation";

type TranslationRow = {
  menu_item_id: string;
  source_hash: string;
  name: string;
  description: string;
  notes: string;
};

/** Splits dishes into those with an up-to-date saved translation and those still missing one. */
export async function getCachedTranslations(
  language: LanguageCode,
  dishes: MenuItem[],
): Promise<{ found: MenuTranslations; missing: MenuItem[] }> {
  if (dishes.length === 0) return { found: {}, missing: [] };

  const { data, error } = await createAdminClient()
    .from("translations")
    .select("menu_item_id, source_hash, name, description, notes")
    .eq("language", language)
    .in(
      "menu_item_id",
      dishes.map((dish) => dish.id),
    );
  if (error) throw error;

  const saved = new Map(((data ?? []) as TranslationRow[]).map((row) => [row.menu_item_id, row]));
  const found: MenuTranslations = {};
  const missing: MenuItem[] = [];
  for (const dish of dishes) {
    const row = saved.get(dish.id);
    if (row && row.source_hash === sourceHash(dish)) {
      found[dish.id] = { name: row.name, description: row.description, notes: row.notes };
    } else {
      missing.push(dish);
    }
  }
  return { found, missing };
}

export async function saveTranslations(
  language: LanguageCode,
  dishes: MenuItem[],
  translated: DishTranslation[],
): Promise<void> {
  const dishesById = new Map(dishes.map((dish) => [dish.id, dish]));
  const rows = translated.flatMap(({ id, name, description, notes }) => {
    const dish = dishesById.get(id);
    return dish
      ? [{ menu_item_id: id, language, source_hash: sourceHash(dish), name, description, notes }]
      : [];
  });
  if (rows.length === 0) return;

  const { error } = await createAdminClient()
    .from("translations")
    .upsert(rows, { onConflict: "menu_item_id,language" });
  if (error) throw error;
}
