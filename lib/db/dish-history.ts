import type { SupabaseClient } from "@supabase/supabase-js";
import { restoreAddonAllergens, type DishHistoryEntry } from "@/lib/dish-history";
import type { DishAddon } from "@/types/menu";

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

/** How a restore went: done, done but the add-ons need checking, blocked by a newer change, or gone. */
export type RestoreResult = "restored" | "check-addons" | "changed" | "missing";

/**
 * Puts a dish's allergen information, including its add-ons', back to an earlier version. Like
 * any edit, this leaves the dish unconfirmed, so someone has to check it again before diners see
 * it. `seenLatest` is the dish's newest history entry when the page was shown: if the dish has
 * changed since, nothing is restored, so a teammate's newer change is never silently undone.
 */
export async function restoreDishVersion(
  supabase: SupabaseClient,
  restaurantId: string,
  entryId: number,
  seenLatest: number,
): Promise<RestoreResult> {
  const { data: entry, error } = await supabase
    .from("dish_history")
    .select(HISTORY_COLUMNS)
    .eq("id", entryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  if (!entry || entry.action === "deleted") return "missing";
  // Read the revision before the history: any edit after this bumps it, so the update below
  // finds nothing, and any edit before it shows up as a newer history entry.
  const { data: dish, error: dishError } = await supabase
    .from("menu_items")
    .select("revision, addons")
    .eq("id", entry.menu_item_id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle<{ revision: number; addons: DishAddon[] | null }>();
  if (dishError) throw dishError;
  if (!dish) return "missing";
  const { data: newest, error: newestError } = await supabase
    .from("dish_history")
    .select("id")
    .eq("menu_item_id", entry.menu_item_id)
    .eq("restaurant_id", restaurantId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number }>();
  if (newestError) throw newestError;
  if (newest?.id !== seenLatest) return "changed";

  const { safety } = entry as DishHistoryEntry;
  const restored = restoreAddonAllergens(dish.addons ?? [], safety.addon_allergens ?? []);
  const { data: updated, error: updateError } = await supabase
    .from("menu_items")
    .update({
      allergens: safety.allergens,
      may_contain: safety.may_contain,
      removable: safety.removable,
      dietary_tags: safety.dietary_tags,
      // Versions from before diners could avoid pork and the like leave those marks alone.
      ...(safety.also_contains ? { also_contains: safety.also_contains } : {}),
      allergen_list: safety.allergen_list,
      ...(dish.addons ? { addons: restored.addons } : {}),
    })
    .eq("id", entry.menu_item_id)
    .eq("restaurant_id", restaurantId)
    .eq("revision", dish.revision)
    .select("id");
  if (updateError) throw updateError;
  if ((updated ?? []).length === 0) return "changed";
  return restored.unsure ? "check-addons" : "restored";
}
