const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "3 hours ago" or "just now", for owner-facing lists. */
export function timeAgo(date: Date, now: Date): string {
  const elapsed = now.getTime() - date.getTime();
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) return format.format(-Math.floor(elapsed / size), unit);
  }
  return "just now";
}
