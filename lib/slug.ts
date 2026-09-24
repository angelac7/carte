export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Menu links use 3 to 40 lowercase letters, numbers, and single dashes. */
export function isValidSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 40 && SLUG_PATTERN.test(value);
}

/** Suggests a menu link from a restaurant name, e.g. "Joe's Ramen" becomes "joes-ramen". */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}
