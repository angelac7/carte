import type { SupabaseClient } from "@supabase/supabase-js";

/** A seasonal menu, like "Brunch": dishes switched on and off together. */
export type DishGroup = { id: string; name: string; active: boolean };

export async function listDishGroups(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<DishGroup[]> {
  const { data, error } = await supabase
    .from("dish_groups")
    .select("id, name, active")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as DishGroup[];
}

export async function createDishGroup(
  supabase: SupabaseClient,
  restaurantId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("dish_groups")
    .insert({ restaurant_id: restaurantId, name });
  if (error) throw error;
}

/** Renames a seasonal menu or switches it on or off. Its dishes follow at once. */
export async function updateDishGroup(
  supabase: SupabaseClient,
  restaurantId: string,
  groupId: string,
  change: { name?: string; active?: boolean },
): Promise<void> {
  const { error } = await supabase
    .from("dish_groups")
    .update(change)
    .eq("id", groupId)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

/** Removes a seasonal menu. Its dishes stay, back on the regular menu. */
export async function deleteDishGroup(
  supabase: SupabaseClient,
  restaurantId: string,
  groupId: string,
): Promise<void> {
  const { error } = await supabase
    .from("dish_groups")
    .delete()
    .eq("id", groupId)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

/**
 * Makes exactly these dishes the seasonal menu's: chosen dishes join it, and dishes no longer
 * chosen go back to the regular menu. Dishes in another seasonal menu move to this one.
 */
export async function setDishGroupDishes(
  supabase: SupabaseClient,
  restaurantId: string,
  groupId: string,
  dishIds: string[],
): Promise<void> {
  const leaving = supabase
    .from("menu_items")
    .update({ group_id: null })
    .eq("restaurant_id", restaurantId)
    .eq("group_id", groupId);
  const { error: leaveError } = dishIds.length
    ? await leaving.not("id", "in", `(${dishIds.join(",")})`)
    : await leaving;
  if (leaveError) throw leaveError;
  if (dishIds.length === 0) return;
  const { error } = await supabase
    .from("menu_items")
    .update({ group_id: groupId })
    .eq("restaurant_id", restaurantId)
    .in("id", dishIds);
  if (error) throw error;
}
