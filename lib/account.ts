import "server-only";
import { createClient } from "@supabase/supabase-js";
import { deleteAllRestaurantPhotos } from "@/lib/storage/dish-photos";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Checks an owner's current password without touching their session, before a change that
 * could lock them out or take over the account.
 */
export async function passwordMatches(email: string, password: string): Promise<boolean> {
  const client = createClient(supabaseUrl(), supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (!error) await client.auth.signOut({ scope: "local" }).catch(() => {});
  return !error;
}

/**
 * Deletes an owner's account for good. The database removes their restaurant, dishes,
 * explanations, and reports along with the login; photos are stored separately, so they go first.
 */
export async function deleteAccount(userId: string, restaurantId: string | null): Promise<void> {
  if (restaurantId) await deleteAllRestaurantPhotos(restaurantId);
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}
