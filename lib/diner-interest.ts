/** Search words are trimmed, lowercased, and shortened, so totals group and stay anonymous. */
export function normalizeSearch(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
}
