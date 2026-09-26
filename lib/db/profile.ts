import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HoursSchema,
  normalizeProfile,
  type FullHours,
  type RestaurantProfile,
} from "@/lib/restaurant-profile";

const PROFILE_COLUMNS =
  "revision, name, listed, description, cuisine, city, address, timezone, hours, occasions, phone, website, reservation_url, price_range, kitchen_practices";

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

export type PublicDetails = {
  listed: boolean;
  description: string;
  address: string;
  /** Only hours the owner saved, never the defaults a new profile starts with. */
  hours: FullHours | null;
};

/** The profile details a menu page tells search engines about, as the owner saved them. */
export async function getPublicDetails(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<PublicDetails> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("listed, description, address, hours")
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  const row = data as { listed?: boolean; description?: string; address?: string; hours?: unknown };
  const hours = HoursSchema.safeParse(row.hours);
  return {
    listed: row.listed === true,
    description: row.description ?? "",
    address: row.address ?? "",
    hours: hours.success ? hours.data : null,
  };
}
