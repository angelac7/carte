import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Publishes the restaurant's draft in one step: every draft dish must already be confirmed. With
 * `replace`, the dishes diners see now are removed at the same moment. Returns how many dishes
 * were published. Throws with code 40001 while any draft dish still needs confirming.
 */
export async function publishDraft(
  supabase: SupabaseClient,
  restaurantId: string,
  replace: boolean,
): Promise<number> {
  const { data, error } = await supabase.rpc("publish_draft", {
    restaurant: restaurantId,
    replace_menu: replace,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Deletes every draft dish; the menu diners see doesn't change. Returns how many were deleted. */
export async function discardDraft(supabase: SupabaseClient, restaurantId: string) {
  const { data, error } = await supabase.rpc("discard_draft", { restaurant: restaurantId });
  if (error) throw error;
  return Number(data ?? 0);
}
