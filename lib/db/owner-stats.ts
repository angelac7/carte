import type { SupabaseClient } from "@supabase/supabase-js";

export type DishViews = { dishId: string; name: string; views: number };
export type DailyViews = { day: string; views: number };

/** Views per dish at one restaurant the signed-in person works on, most viewed first. */
export async function getDishViews(
  supabase: SupabaseClient,
  restaurantId: string,
  days = 7,
): Promise<DishViews[]> {
  const { data, error } = await supabase.rpc("restaurant_dish_views", {
    restaurant: restaurantId,
    days,
  });
  if (error) throw error;
  return ((data ?? []) as { dish_id: string; dish_name: string; views: number | string }[]).map(
    (row) => ({
      dishId: row.dish_id,
      name: row.dish_name,
      views: Number(row.views),
    }),
  );
}

/** Total dish views per day at one restaurant, oldest first. */
export async function getDailyViews(
  supabase: SupabaseClient,
  restaurantId: string,
  days = 14,
): Promise<DailyViews[]> {
  const { data, error } = await supabase.rpc("restaurant_daily_views", {
    restaurant: restaurantId,
    days,
  });
  if (error) throw error;
  return ((data ?? []) as { day: string; views: number | string }[]).map((row) => ({
    day: row.day,
    views: Number(row.views),
  }));
}
