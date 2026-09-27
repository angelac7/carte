import type { SupabaseClient } from "@supabase/supabase-js";
import { restoredDishRows } from "@/lib/backup";
import { listDishGroups } from "@/lib/db/dish-groups";
import { isLanguageCode } from "@/lib/languages";
import { translationComplete } from "@/lib/publish-checklist";
import { translationHash } from "@/lib/source-hash";
import type { Backup } from "@/types/backup";
import type { MenuItem } from "@/types/menu";

/** A restaurant can only restore a backup while it has no draft, so drafts never mix. */
export class DraftExistsError extends Error {}

/**
 * Restores a backup as a draft: its seasonal menus (reusing ones with the same name), its dishes,
 * unconfirmed, and its corrected translations. With `withProfile`, the profile is restored too.
 * The menu diners see doesn't change until the owner publishes. Returns how many dishes it added.
 */
export async function restoreBackup(
  supabase: SupabaseClient,
  restaurantId: string,
  backup: Backup,
  withProfile: boolean,
): Promise<number> {
  const { count, error: draftError } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("draft", true);
  if (draftError) throw draftError;
  if (count) throw new DraftExistsError();

  const existing = await listDishGroups(supabase, restaurantId);
  const groupIds: string[] = [];
  for (const menu of backup.seasonal_menus) {
    const same = existing.find((group) => group.name.toLowerCase() === menu.name.toLowerCase());
    if (same) {
      groupIds.push(same.id);
      continue;
    }
    const { data, error } = await supabase
      .from("dish_groups")
      .insert({ restaurant_id: restaurantId, name: menu.name, active: menu.active })
      .select("id")
      .single();
    if (error) throw error;
    groupIds.push(data.id);
  }

  const { data: last, error: lastError } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;
  const start = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  if (backup.dishes.length > 0) {
    const { data: added, error } = await supabase
      .from("menu_items")
      .insert(restoredDishRows(backup, restaurantId, groupIds, start))
      .select("id, name, description, notes, source_language, section, sizes, addons, sort_order");
    if (error) throw error;
    // Matched by position, which the new dishes' order numbers record.
    const byOrder = new Map(
      (added as (MenuItem & { sort_order: number })[]).map((d) => [d.sort_order, d]),
    );
    const translations = backup.dishes.flatMap((dish, index) => {
      const saved = byOrder.get(start + index);
      if (!saved || !dish.translations) return [];
      return Object.entries(dish.translations).flatMap(([language, text]) => {
        const row = { menu_item_id: saved.id, source_hash: translationHash(saved), ...text! };
        return isLanguageCode(language) && translationComplete(saved, row)
          ? [{ ...row, language, edited_at: new Date().toISOString() }]
          : [];
      });
    });
    if (translations.length > 0) {
      const { error: translationError } = await supabase
        .from("translations")
        .upsert(translations, { onConflict: "menu_item_id,language" });
      if (translationError) throw translationError;
    }
  }

  if (withProfile) {
    const { error } = await supabase
      .from("restaurants")
      .update(backup.profile)
      .eq("id", restaurantId);
    if (error) throw error;
  }
  return backup.dishes.length;
}
