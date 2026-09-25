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
 * Deletes an owner's account for good. The database removes the restaurants they own, with their
 * dishes, explanations, and reports, and any places they help edit; photos are stored separately,
 * so they go first.
 */
export async function deleteAccount(userId: string, ownedRestaurantIds: string[]): Promise<void> {
  for (const restaurantId of ownedRestaurantIds) await deleteAllRestaurantPhotos(restaurantId);
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}

/** Team members' emails, so an owner can see who helps with their menu. */
export async function emailsFor(userIds: string[]): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const found = await Promise.all(
    userIds.map(
      async (id) => [id, (await admin.auth.admin.getUserById(id)).data.user?.email ?? ""] as const,
    ),
  );
  return new Map(found);
}
