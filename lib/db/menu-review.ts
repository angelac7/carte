import type { SupabaseClient } from "@supabase/supabase-js";
import type { LanguageCode } from "@/lib/languages";
import type { SavedTranslation } from "@/lib/publish-checklist";

export async function menuReviewDates(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc("latest_dish_reviews", { restaurant: restaurantId });
  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).map((row: { menu_item_id: string; reviewed_at: string }) => [
      row.menu_item_id,
      row.reviewed_at,
    ]),
  );
}
export async function menuReviewTranslations(
  supabase: SupabaseClient,
  ids: string[],
  language: LanguageCode,
): Promise<SavedTranslation[]> {
  const rows: SavedTranslation[] = [];
  // Stay below query URL and response limits for large menus.
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from("translations")
      .select("menu_item_id,source_hash,name,description,notes,section,options")
      .eq("language", language)
      .in("menu_item_id", ids.slice(i, i + 100));
    if (error) throw error;
    rows.push(
      ...((data ?? []).map((row) => ({
        ...row,
        description: row.description ?? "",
        notes: row.notes ?? "",
        section: row.section ?? "",
        options: row.options ?? [],
      })) as SavedTranslation[]),
    );
  }
  return rows;
}
export async function reviewDishAgain(
  supabase: SupabaseClient,
  restaurantId: string,
  dish: string,
  revision: number,
): Promise<void> {
  const { error } = await supabase.rpc("review_dish_again", {
    restaurant: restaurantId,
    dish,
    expected_revision: revision,
  });
  if (error) throw error;
}
