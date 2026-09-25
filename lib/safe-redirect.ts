/** Only allow redirects to pages on this site, never to other websites. */
export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (
    typeof next !== "string" ||
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\") ||
    /[\\\x00-\x20]/.test(next)
  ) {
    return fallback;
  }
  return next;
}

/** The page a login link asked to return to, or undefined when it didn't ask for a safe one. */
export function requestedNextPath(next: unknown): string | undefined {
  return safeNextPath(next, "") || undefined;
}
