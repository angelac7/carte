import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** A saved OpenStreetMap result, if it exists and isn't too old. */
export async function readPlaceCache(
  key: string,
  maxAgeMs: number,
): Promise<{ value: unknown } | undefined> {
  const { data, error } = await createAdminClient()
    .from("place_cache")
    .select("data, fetched_at")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return undefined;
  const row = data as { data: unknown; fetched_at: string };
  if (row.data === null || Date.now() - new Date(row.fetched_at).getTime() > maxAgeMs) {
    return undefined;
  }
  return { value: row.data };
}

export async function writePlaceCache(key: string, value: unknown): Promise<void> {
  const { error } = await createAdminClient()
    .from("place_cache")
    .upsert({ key, data: value, fetched_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
