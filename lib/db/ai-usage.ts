import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Counts one AI call if today's limits allow it, for one restaurant or none. Only Carte's server
 * can count calls, so this uses the secret key, like the rate limits.
 */
export async function consumeAiCall(
  restaurantId: string | null,
  feature: string,
  restaurantLimit: number,
  dailyLimit: number,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("consume_ai_call", {
    for_restaurant: restaurantId,
    for_feature: feature,
    restaurant_limit: restaurantLimit,
    daily_limit: dailyLimit,
  });
  if (error) throw error;
  return data === true;
}

export type AiUsageRow = {
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_slug: string | null;
  feature: string;
  today: number;
  recent: number;
};

/** AI calls by restaurant and feature over the last days, for Carte's administrators only. */
export async function listAiUsage(supabase: SupabaseClient, days = 30): Promise<AiUsageRow[]> {
  const { data, error } = await supabase.rpc("admin_ai_usage", { days });
  if (error) throw error;
  return ((data ?? []) as AiUsageRow[]).map((row) => ({
    ...row,
    today: Number(row.today ?? 0),
    recent: Number(row.recent ?? 0),
  }));
}
