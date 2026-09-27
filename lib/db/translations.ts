import "server-only";
import type { LanguageCode } from "@/lib/languages";
import { translationHash } from "@/lib/source-hash";
import { translationComplete } from "@/lib/publish-checklist";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MenuItem } from "@/types/menu";
import type { DishTranslation, MenuTranslations } from "@/types/translation";

type TranslationRow = {
  menu_item_id: string;
  source_hash: string;
  name: string;
  description: string;
  notes: string;
  section: string;
  options: string[];
};

/** Splits dishes into those with an up-to-date saved translation and those still missing one. */
export async function getCachedTranslations(
  language: LanguageCode,
  dishes: MenuItem[],
): Promise<{ found: MenuTranslations; missing: MenuItem[] }> {
  if (dishes.length === 0) return { found: {}, missing: [] };

  const rows: TranslationRow[] = [];
  // A hundred ids at a time keeps the request short enough for large menus.
  for (let i = 0; i < dishes.length; i += 100) {
    const { data, error } = await createAdminClient()
      .from("translations")
      .select("menu_item_id, source_hash, name, description, notes, section, options")
      .eq("language", language)
      .in(
        "menu_item_id",
        dishes.slice(i, i + 100).map((dish) => dish.id),
      );
    if (error) throw error;
    rows.push(...((data ?? []) as TranslationRow[]));
  }

  const saved = new Map(rows.map((row) => [row.menu_item_id, row]));
  const found: MenuTranslations = {};
  const missing: MenuItem[] = [];
  for (const dish of dishes) {
    const row = saved.get(dish.id);
    if (row && translationComplete(dish, { ...row, options: row.options ?? [] })) {
      found[dish.id] = {
        name: row.name,
        description: row.description,
        notes: row.notes,
        section: row.section,
        options: row.options ?? [],
      };
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
  const rows = translated.flatMap(({ id, name, description, notes, section, options }) => {
    const dish = dishesById.get(id);
    return dish
      ? [
          {
            menu_item_id: id,
            language,
            source_hash: translationHash(dish),
            name,
            description,
            notes,
            section,
            options,
            // An AI translation replaces any earlier correction, made for the dish's old text.
            edited_at: null,
          },
        ]
      : [];
  });
  if (rows.length === 0) return;

  const { error } = await createAdminClient()
    .from("translations")
    .upsert(rows, { onConflict: "menu_item_id,language" });
  if (error) throw error;
}
