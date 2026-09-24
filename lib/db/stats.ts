import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Counts one anonymous view of a confirmed dish, for trending. */
export async function recordDishView(dishId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("record_dish_view", { item: dishId });
  if (error) throw error;
}
