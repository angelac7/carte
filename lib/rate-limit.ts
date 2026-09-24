import { createHmac } from "node:crypto";
import { consumeRateLimit } from "@/lib/db/rate-limits";

/** Atomic limits shared by every server. Fail closed if the counter store is unavailable. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret) throw new Error("Rate limit storage is not configured");
    const hash = createHmac("sha256", secret).update(key).digest("hex");
    return await consumeRateLimit(hash, limit, windowMs);
  } catch (error) {
    console.error("Rate limit check unavailable:", error);
    return false;
  }
}

/** Identifies a visitor by IP address for rate limiting. */
export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

/** Same as clientKey, for server pages that have headers but no Request. */
export function clientKeyFromHeaders(headers: Pick<Headers, "get">): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
