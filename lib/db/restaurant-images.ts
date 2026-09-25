import type { SupabaseClient } from "@supabase/supabase-js";

export type RestaurantImageKind = "logo" | "cover";
export type RestaurantImages = { logo_url: string | null; cover_url: string | null };

const COLUMN = { logo: "logo_url", cover: "cover_url" } as const;

export async function getRestaurantImages(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<RestaurantImages> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("logo_url, cover_url")
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  return data as RestaurantImages;
}

/** Points the restaurant at a new logo or cover photo, or clears it with null. */
export async function setRestaurantImage(
  supabase: SupabaseClient,
  restaurantId: string,
  kind: RestaurantImageKind,
  url: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("restaurants")
    .update({ [COLUMN[kind]]: url })
    .eq("id", restaurantId);
  if (error) throw error;
}
