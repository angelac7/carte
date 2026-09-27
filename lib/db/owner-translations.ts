import type { SupabaseClient } from "@supabase/supabase-js";
import type { LanguageCode } from "@/lib/languages";
import type { TranslatedText } from "@/types/translation";

export type SavedDishTranslation = TranslatedText & {
  menu_item_id: string;
  source_hash: string;
  edited_at: string | null;
};

/** A restaurant team's saved translations of these dishes into one language. */
export async function listDishTranslations(
  supabase: SupabaseClient,
  dishIds: string[],
  language: LanguageCode,
): Promise<SavedDishTranslation[]> {
  const rows: SavedDishTranslation[] = [];
  // A hundred ids at a time keeps the request short enough for large menus.
  for (let i = 0; i < dishIds.length; i += 100) {
    const { data, error } = await supabase
      .from("translations")
      .select("menu_item_id, source_hash, name, description, notes, section, options, edited_at")
      .eq("language", language)
      .in("menu_item_id", dishIds.slice(i, i + 100));
    if (error) throw error;
    rows.push(
      ...((data ?? []).map((row) => ({
        ...row,
        description: row.description ?? "",
        notes: row.notes ?? "",
        section: row.section ?? "",
        options: row.options ?? [],
      })) as SavedDishTranslation[]),
    );
  }
  return rows;
}

/**
 * Saves a team's corrected translation of one dish, marked as theirs. It stays until the dish's
 * own text changes; `sourceHash` is the hash of that text now.
 */
export async function saveCorrectedTranslation(
  supabase: SupabaseClient,
  dishId: string,
  language: LanguageCode,
  sourceHash: string,
  text: TranslatedText,
): Promise<void> {
  const { error } = await supabase.from("translations").upsert(
    {
      menu_item_id: dishId,
      language,
      source_hash: sourceHash,
      ...text,
      edited_at: new Date().toISOString(),
    },
    { onConflict: "menu_item_id,language" },
  );
  if (error) throw error;
}

/** Every translation a restaurant's team corrected for these dishes, in any language. */
export async function listCorrectedTranslations(
  supabase: SupabaseClient,
  dishIds: string[],
): Promise<(SavedDishTranslation & { language: LanguageCode })[]> {
  const rows: (SavedDishTranslation & { language: LanguageCode })[] = [];
  for (let i = 0; i < dishIds.length; i += 100) {
    const { data, error } = await supabase
      .from("translations")
      .select(
        "menu_item_id, language, source_hash, name, description, notes, section, options, edited_at",
      )
      .not("edited_at", "is", null)
      .in("menu_item_id", dishIds.slice(i, i + 100));
    if (error) throw error;
    rows.push(
      ...((data ?? []).map((row) => ({
        ...row,
        description: row.description ?? "",
        notes: row.notes ?? "",
        section: row.section ?? "",
        options: row.options ?? [],
      })) as (SavedDishTranslation & { language: LanguageCode })[]),
    );
  }
  return rows;
}
