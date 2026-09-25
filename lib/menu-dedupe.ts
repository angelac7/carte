/** A dish name reduced to what matters for spotting repeats: case, spacing, and width. */
export function dishNameKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * The incoming dishes whose names aren't already on the menu or earlier in the same batch,
 * so uploading the same menu photo twice doesn't list every dish twice.
 */
export function withoutDuplicates<T extends { name: string }>(
  existingNames: readonly string[],
  incoming: readonly T[],
): T[] {
  const seen = new Set(existingNames.map(dishNameKey));
  return incoming.filter((dish) => {
    const key = dishNameKey(dish.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
