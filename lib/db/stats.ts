import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Counts one anonymous view of a confirmed dish, for trending. */
export async function recordDishView(dishId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("record_dish_view", { item: dishId });
  if (error) throw error;
}

/** Adds one visit's filters, or one search that found nothing, to a restaurant's totals. */
export async function recordDinerInterest(
  restaurantId: string,
  interest: { avoid: string[]; diets: string[]; missed: string },
): Promise<void> {
  const { error } = await createAdminClient().rpc("record_diner_interest", {
    restaurant: restaurantId,
    avoid: interest.avoid,
    diets: interest.diets,
    missed: interest.missed,
  });
  if (error) throw error;
}
