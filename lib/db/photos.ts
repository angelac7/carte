import type { SupabaseClient } from "@supabase/supabase-js";

/** Whether a dish belongs to this restaurant, and its current photo. */
export async function getDishPhoto(
  supabase: SupabaseClient,
  restaurantId: string,
  dishId: string,
): Promise<{ exists: boolean; photoUrl: string | null }> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("photo_url")
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { exists: false, photoUrl: null };
  return { exists: true, photoUrl: (data as { photo_url: string | null }).photo_url };
}

export async function setDishPhoto(
  supabase: SupabaseClient,
  restaurantId: string,
  dishId: string,
  photoUrl: string | null,
  revision: number,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .update({ photo_url: photoUrl, confirmed: false })
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .eq("revision", revision)
    .select("revision")
    .maybeSingle();
  if (error) throw error;
  return data?.revision ?? null;
}
