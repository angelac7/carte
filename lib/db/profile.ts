import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeProfile, type RestaurantProfile } from "@/lib/restaurant-profile";

const PROFILE_COLUMNS =
  "revision, listed, description, cuisine, city, address, timezone, hours, occasions";

export async function getRestaurantProfile(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<RestaurantProfile> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(PROFILE_COLUMNS)
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  return normalizeProfile(data);
}

export async function updateRestaurantProfile(
  supabase: SupabaseClient,
  restaurantId: string,
  profile: RestaurantProfile,
): Promise<number | null> {
  const { revision, ...fields } = profile;
  const { data, error } = await supabase
    .from("restaurants")
    .update(fields)
    .eq("id", restaurantId)
    .eq("revision", revision!)
    .select("revision")
    .maybeSingle();
  if (error) throw error;
  return data?.revision ?? null;
}
