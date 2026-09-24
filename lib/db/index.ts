import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractedDish, MenuItem } from "@/types/menu";

export type Restaurant = { id: string; name: string; slug: string; cuisine: string };

const RESTAURANT_COLUMNS = "id, name, slug, cuisine";
const DISH_COLUMNS =
  "id, name, description, price, allergens, dietary_tags, notes, confirmed, photo_url, revision, source_language";

export async function getOwnerRestaurant(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Restaurant | null;
}

export async function getRestaurantBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Restaurant | null;
}

export async function createRestaurant(
  supabase: SupabaseClient,
  ownerId: string,
  name: string,
  slug: string,
): Promise<{ ok: true } | { ok: false; reason: "taken" | "failed" }> {
  const { error } = await supabase.from("restaurants").insert({ owner_id: ownerId, name, slug });
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === "23505" ? "taken" : "failed" };
}

/** Every dish for the owner's restaurant, confirmed or not. */
export async function listDishes(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select(DISH_COLUMNS)
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as MenuItem[];
}

/** Only dishes the owner has confirmed. Used for everything diners see. */
export async function getConfirmedDishes(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select(DISH_COLUMNS)
    .eq("restaurant_id", restaurantId)
    .eq("confirmed", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as MenuItem[];
}

/** Saves dishes from a menu scan. New dishes always start unconfirmed. */
export async function addDishes(
  supabase: SupabaseClient,
  restaurantId: string,
  dishes: ExtractedDish[],
): Promise<MenuItem[]> {
  if (dishes.length === 0) return [];
  const rows = dishes.map((dish) => ({
    restaurant_id: restaurantId,
    source_language: dish.source_language ?? "und",
    name: dish.name,
    description: dish.description,
    price: dish.price,
    allergens: dish.likely_allergens,
    dietary_tags: dish.dietary_tags,
    notes: "",
    confirmed: false,
  }));
  const { data, error } = await supabase.from("menu_items").insert(rows).select(DISH_COLUMNS);
  if (error) throw error;
  return (data ?? []) as unknown as MenuItem[];
}

export async function updateDish(
  supabase: SupabaseClient,
  restaurantId: string,
  dish: MenuItem,
): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .update({
      source_language: dish.source_language ?? "und",
      name: dish.name,
      description: dish.description,
      price: dish.price,
      allergens: dish.allergens,
      dietary_tags: dish.dietary_tags,
      notes: dish.notes,
      confirmed: dish.confirmed,
    })
    .eq("id", dish.id)
    .eq("revision", dish.revision!)
    .eq("restaurant_id", restaurantId)
    .select(DISH_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as MenuItem | null;
}

export async function deleteDish(
  supabase: SupabaseClient,
  restaurantId: string,
  id: string,
  revision: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("revision", revision)
    .eq("restaurant_id", restaurantId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** One confirmed dish, only if it belongs to the given restaurant. */
export async function getConfirmedDish(
  supabase: SupabaseClient,
  restaurantId: string,
  dishId: string,
): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .select(DISH_COLUMNS)
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .eq("confirmed", true)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as MenuItem | null;
}

/** Deletes every dish for a restaurant and returns their photo addresses, so the files can be removed too. */
export async function deleteAllDishes(
  supabase: SupabaseClient,
  restaurantId: string,
  expected: { id: string; revision: number }[],
): Promise<string[]> {
  const { data, error } = await supabase.rpc("delete_menu_snapshot", {
    restaurant: restaurantId,
    expected,
  });
  if (error) throw error;
  return ((data ?? []) as { photo_url: string | null }[]).flatMap((row) =>
    row.photo_url ? [row.photo_url] : [],
  );
}
