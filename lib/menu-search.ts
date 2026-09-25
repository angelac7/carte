/** Text reduced for matching: accents, case, width, and spacing don't matter. */
export function searchKey(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** True when every word of the query appears somewhere in the dish's text. */
export function matchesSearch(fields: readonly string[], query: string): boolean {
  const words = searchKey(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = searchKey(fields.join(" "));
  return words.every((word) => haystack.includes(word));
}

/** A name's core: no bracketed glosses, punctuation, or spacing. */
function nameCore(name: string): string {
  return searchKey(name.replace(/\([^)]*\)|\[[^\]]*\]/g, " ")).replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Whether to show a dish's original name under its translated one. Hidden when the
 * translation only adds a gloss, like "Mushroom Ramyun (Korean-style ramen)" for
 * "MUSHROOM RAMYUN (V)"; shown when it's genuinely different, like "Cold noodles" for "냉면".
 */
export function showOriginalName(shown: string, original: string): boolean {
  const shownCore = nameCore(shown);
  const originalCore = nameCore(original);
  if (!originalCore || shownCore === originalCore) return false;
  return !shownCore.includes(originalCore);
}
