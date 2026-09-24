import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function consumeRateLimit(
  keyHash: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    key_hash: keyHash,
    max_hits: limit,
    window_ms: windowMs,
  });
  if (error) throw error;
  return data === true;
}
