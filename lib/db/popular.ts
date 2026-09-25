import type { SupabaseClient } from "@supabase/supabase-js";

/** Up to three of a restaurant's most-opened dishes this month, for a "Popular" badge. */
export async function getPopularDishIds(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc("popular_dishes", { restaurant: restaurantId });
  if (error) throw error;
  return ((data ?? []) as { dish_id: string }[]).map((row) => row.dish_id);
}
