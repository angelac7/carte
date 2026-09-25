import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  listed: boolean;
  suspended: boolean;
  created_at: string;
  dishes: number;
  confirmed: number;
  open_reports: number;
};

/** Every restaurant, newest first, 100 at a time. The database checks the caller is an admin. */
export async function listAllRestaurants(
  supabase: SupabaseClient,
  page = 0,
): Promise<AdminRestaurant[]> {
  const { data, error } = await supabase.rpc("admin_restaurants", { page_offset: page * 100 });
  if (error) throw error;
  return ((data ?? []) as AdminRestaurant[]).map((row) => ({
    ...row,
    dishes: Number(row.dishes),
    confirmed: Number(row.confirmed),
    open_reports: Number(row.open_reports),
  }));
}

/** Suspends a restaurant's menu for diners, or restores it. Administrators only. */
export async function setSuspended(
  supabase: SupabaseClient,
  restaurantId: string,
  suspend: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("admin_moderate", {
    restaurant: restaurantId,
    suspend,
  });
  if (error) throw error;
}
