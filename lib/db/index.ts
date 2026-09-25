import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractedDish, MenuItem } from "@/types/menu";

/** An owner runs the restaurant; an editor was invited to help keep its menu up to date. */
export type RestaurantRole = "owner" | "editor";

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  city?: string | null;
  timezone?: string;
  phone?: string;
  website?: string;
  reservation_url?: string;
  price_range?: number;
  logo_url?: string | null;
  cover_url?: string | null;
  /** Set by Carte when a menu breaks the rules; diners can't see it. */
  suspended?: boolean;
  /** The signed-in person's part in this restaurant, when looked up for them. */
  role?: RestaurantRole;
};

const RESTAURANT_COLUMNS =
  "id, name, slug, cuisine, city, timezone, phone, website, reservation_url, price_range, logo_url, cover_url, suspended";
const DISH_COLUMNS =
  "id, name, description, price, allergens, dietary_tags, notes, confirmed, photo_url, revision, source_language, section, sort_order, sold_out_on, special, available_from, available_until, sizes, addons, allergen_list, removable, may_contain, spice";

/** Every restaurant a person can work on: the ones they own first, then ones they help edit. */
export async function listMyRestaurants(
  supabase: SupabaseClient,
  userId: string,
): Promise<Restaurant[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", userId);
  if (membershipError) throw membershipError;
  const memberIds = (memberships ?? []).map(
    (row) => (row as { restaurant_id: string }).restaurant_id,
  );
  const filter = [
    `owner_id.eq.${userId}`,
    ...(memberIds.length ? [`id.in.(${memberIds.join(",")})`] : []),
  ];
  const { data, error } = await supabase
    .from("restaurants")
    .select(`${RESTAURANT_COLUMNS}, owner_id`)
    .or(filter.join(","))
    .order("created_at");
  if (error) throw error;
  const restaurants = ((data ?? []) as unknown as (Restaurant & { owner_id: string })[]).map(
    ({ owner_id, ...restaurant }) => ({
      ...restaurant,
      role: (owner_id === userId ? "owner" : "editor") as RestaurantRole,
    }),
  );
  return [
    ...restaurants.filter((r) => r.role === "owner"),
    ...restaurants.filter((r) => r.role === "editor"),
  ];
}

export async function getRestaurantBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("slug", slug)
    // A suspended menu is gone for diners; its owner still reaches it from the dashboard.
    .eq("suspended", false)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Restaurant | null;
}

/** Links to every menu shown on Discover: listed, with at least one confirmed dish. */
export async function listListedMenuSlugs(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("slug, menu_items!inner(id)")
    .eq("listed", true)
    .eq("suspended", false)
    .eq("menu_items.confirmed", true)
    .limit(1, { referencedTable: "menu_items" })
    .order("slug")
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map((row) => (row as { slug: string }).slug);
}

export async function createRestaurant(
  supabase: SupabaseClient,
  ownerId: string,
  name: string,
  slug: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "taken" | "failed" }> {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ owner_id: ownerId, name, slug })
    .select("id")
    .single();
  if (!error) return { ok: true, id: (data as { id: string }).id };
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
    .order("sort_order")
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
    .order("sort_order")
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
  // New dishes go after the existing ones, in the order they were read or added.
  const { data: last, error: lastError } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;
  const start = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1;
  const rows = dishes.map((dish, index) => ({
    restaurant_id: restaurantId,
    source_language: dish.source_language ?? "und",
    name: dish.name,
    description: dish.description,
    price: dish.price,
    section: dish.section ?? "",
    spice: dish.spice ?? null,
    sort_order: start + index,
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
      // Layout and availability are left alone when the edit doesn't include them.
      ...(dish.section !== undefined && { section: dish.section }),
      ...(dish.special !== undefined && { special: dish.special }),
      ...(dish.spice !== undefined && { spice: dish.spice }),
      ...(dish.sizes !== undefined && { sizes: dish.sizes }),
      // Kept consistent with the dish's own allergens, which the database also checks.
      ...(dish.removable !== undefined && {
        removable: dish.removable.filter((allergen) => dish.allergens.includes(allergen)),
      }),
      ...(dish.may_contain !== undefined && {
        may_contain: dish.may_contain.filter((allergen) => !dish.allergens.includes(allergen)),
      }),
      // Set only when the owner presses Confirm, never passed through from a request.
      ...(dish.allergen_list !== undefined && { allergen_list: dish.allergen_list }),
      ...(dish.addons !== undefined && { addons: dish.addons }),
      ...(dish.available_from !== undefined && {
        available_from: dish.available_from,
        available_until: dish.available_until ?? null,
      }),
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

/** Marks a dish sold out for a service day, or available again with null. */
export async function setSoldOut(
  supabase: SupabaseClient,
  restaurantId: string,
  dishId: string,
  serviceDay: string | null,
): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .update({ sold_out_on: serviceDay })
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .select(DISH_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as MenuItem | null;
}

/** Saves a new dish order and returns the dishes whose order changed, with their new versions. */
export async function reorderDishes(
  supabase: SupabaseClient,
  restaurantId: string,
  orderedIds: string[],
): Promise<{ id: string; revision: number; sort_order: number }[]> {
  const { data, error } = await supabase.rpc("reorder_dishes", {
    restaurant: restaurantId,
    ordered: orderedIds,
  });
  if (error) throw error;
  return (data ?? []) as { id: string; revision: number; sort_order: number }[];
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
