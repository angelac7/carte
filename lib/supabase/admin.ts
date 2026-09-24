import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";

/**
 * A privileged client that bypasses Row Level Security. Use only for server-side jobs
 * such as saving translations, never for anything a visitor controls directly.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing SUPABASE_SECRET_KEY. Add it to .env.local.");
  return createClient(supabaseUrl(), secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
