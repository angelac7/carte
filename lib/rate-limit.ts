type Bucket = { count: number; resetAt: number };

// In-memory limits for local development. At launch, move to a shared store such as Redis
// so limits hold across servers and restarts.
const buckets = new Map<string, Bucket>();

/** Returns true if this request is allowed, false once the key hits its limit for the window. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  if (buckets.size > 5000) {
    for (const [k, bucket] of buckets) if (now >= bucket.resetAt) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Identifies a visitor by IP address for rate limiting. */
export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
