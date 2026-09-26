import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishHistoryEntry } from "@/lib/dish-history";

const HISTORY_COLUMNS = "id, menu_item_id, dish_name, action, changed_by, changed_at, safety";

/** The latest allergen changes and confirmations for a restaurant, newest first. */
export async function listDishHistory(
  supabase: SupabaseClient,
  restaurantId: string,
  limit = 200,
): Promise<DishHistoryEntry[]> {
  const { data, error } = await supabase
    .from("dish_history")
    .select(HISTORY_COLUMNS)
    .eq("restaurant_id", restaurantId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DishHistoryEntry[];
}

/**
 * Puts a dish's allergen information back to an earlier version. Like any edit, this leaves the
 * dish unconfirmed, so someone has to check it again before diners see it. Returns false if the
 * version or the dish can't be found.
 */
export async function restoreDishVersion(
  supabase: SupabaseClient,
  restaurantId: string,
  entryId: number,
): Promise<boolean> {
  const { data: entry, error } = await supabase
    .from("dish_history")
    .select(HISTORY_COLUMNS)
    .eq("id", entryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  if (!entry || entry.action === "deleted") return false;
  const { safety } = entry as DishHistoryEntry;
  const { data: updated, error: updateError } = await supabase
    .from("menu_items")
    .update({
      allergens: safety.allergens,
      may_contain: safety.may_contain,
      removable: safety.removable,
      dietary_tags: safety.dietary_tags,
      allergen_list: safety.allergen_list,
    })
    .eq("id", entry.menu_item_id)
    .eq("restaurant_id", restaurantId)
    .select("id");
  if (updateError) throw updateError;
  return (updated ?? []).length > 0;
}
