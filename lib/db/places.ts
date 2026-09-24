import type { SupabaseClient } from "@supabase/supabase-js";
import { parseOpeningHours, type OsmPlace } from "@/lib/places/normalize";

/** Map listings that link to an approved, listed Carte menu: listing id to menu slug. */
export async function carteLinksForPlaces(
  supabase: SupabaseClient,
  placeIds: string[],
): Promise<Map<string, string>> {
  if (placeIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("restaurants")
    .select("slug, osm_id")
    .in("osm_id", placeIds)
    .eq("osm_verified", true)
    .eq("listed", true);
  if (error) throw error;
  return new Map(
    ((data ?? []) as { slug: string; osm_id: string }[]).map((r) => [r.osm_id, r.slug]),
  );
}

export async function getClaim(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<{ placeId: string | null; verified: boolean }> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("osm_id, osm_verified")
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  const row = data as { osm_id: string | null; osm_verified: boolean };
  return { placeId: row.osm_id, verified: row.osm_verified };
}

/**
 * Links a restaurant to its map listing and fills in any empty profile fields from the map.
 * The link isn't shown to diners until Carte approves it.
 */
export async function claimPlace(
  supabase: SupabaseClient,
  restaurantId: string,
  place: OsmPlace,
): Promise<{ ok: true } | { ok: false; reason: "taken" | "failed" }> {
  const { data, error: readError } = await supabase
    .from("restaurants")
    .select("address, city, cuisine, hours")
    .eq("id", restaurantId)
    .single();
  if (readError) return { ok: false, reason: "failed" };
  const current = data as { address: string; city: string; cuisine: string; hours: object };

  const update: Record<string, unknown> = { osm_id: place.id };
  if (!current.address && place.address) update.address = place.address.slice(0, 200);
  if (!current.city && place.city) update.city = place.city.slice(0, 80);
  if (!current.cuisine && place.cuisine.length)
    update.cuisine = place.cuisine.join(", ").slice(0, 60);
  const hours = parseOpeningHours(place.openingHours);
  if (hours && Object.keys(current.hours ?? {}).length === 0) update.hours = hours;

  const { error } = await supabase.from("restaurants").update(update).eq("id", restaurantId);
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === "23505" ? "taken" : "failed" };
}
