import type { SupabaseClient } from "@supabase/supabase-js";
import type { Allergen, DietaryTag } from "@/lib/allergens";
import type { Occasion, WeeklyHours } from "@/lib/restaurant-profile";

export type DishResult = {
  dish_id: string;
  dish_name: string;
  description: string;
  price: string;
  allergens: Allergen[];
  dietary_tags: DietaryTag[];
  restaurant_name: string;
  restaurant_slug: string;
  city: string;
  timezone: string;
  hours: WeeklyHours;
  occasions: Occasion[];
  photo_url: string | null;
  /** Which allergen list the dish was checked against: 1 was the original 9, 2 is all 14. */
  allergen_list?: number;
};

export type RestaurantResult = {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  city: string;
  address: string;
  description: string;
  timezone: string;
  hours: WeeklyHours;
  occasions: Occasion[];
  cover_url: string | null;
};

export type TrendingDish = {
  dish_id: string;
  dish_name: string;
  price: string;
  allergens: Allergen[];
  dietary_tags: DietaryTag[];
  restaurant_name: string;
  restaurant_slug: string;
  city: string;
  views: number;
  photo_url: string | null;
  allergen_list?: number;
};

export type DiscoverFilters = {
  avoid?: Allergen[];
  onlyTags?: DietaryTag[];
  city?: string;
  occasion?: Occasion | "";
  openOnly?: boolean;
};

function filterParams(filters: DiscoverFilters) {
  return {
    avoid: filters.avoid ?? [],
    only_tags: filters.onlyTags ?? [],
    filter_city: filters.city ?? "",
    filter_occasion: filters.occasion ?? "",
    open_only: filters.openOnly ?? false,
  };
}

export async function searchDishes(
  supabase: SupabaseClient,
  search: string,
  filters: DiscoverFilters = {},
): Promise<DishResult[]> {
  const { data, error } = await supabase.rpc("search_dishes", { search, ...filterParams(filters) });
  if (error) throw error;
  return (data ?? []) as DishResult[];
}

export async function searchRestaurants(
  supabase: SupabaseClient,
  search: string,
  filters: DiscoverFilters = {},
): Promise<RestaurantResult[]> {
  const { data, error } = await supabase.rpc("search_restaurants", {
    search,
    ...filterParams(filters),
  });
  if (error) throw error;
  return (data ?? []) as RestaurantResult[];
}

export async function trendingDishes(
  supabase: SupabaseClient,
  filters: DiscoverFilters = {},
): Promise<TrendingDish[]> {
  const { data, error } = await supabase.rpc("trending_dishes", {
    result_limit: 8,
    ...filterParams(filters),
  });
  if (error) throw error;
  return (data ?? []) as TrendingDish[];
}

/** Cities of listed restaurants, for the city filter. */
export async function listCities(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("city")
    .eq("listed", true)
    .neq("city", "");
  if (error) throw error;
  const cities = ((data ?? []) as { city: string }[]).map((row) => row.city);
  return [...new Set(cities)].sort();
}
