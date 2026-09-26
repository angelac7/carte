import type { Allergen, OtherAvoid } from "@/lib/allergens";
import type { Severity } from "@/lib/diner-prefs";

/** What this diner would share: their saved allergies, other things they avoid, and severity. */
export type MyAllergies = { avoid: Allergen[]; alsoAvoid: OtherAvoid[]; severity: Severity };

/** One person's shared allergies, with an optional name or seat. */
export type TableAllergyEntry = MyAllergies & { label: string };

// The same letters and digits as table codes: none that can be mistaken for another.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A random id for this phone at one table. 32 letters, so every byte maps evenly. */
export function newPersonId(randomBytes: Uint8Array): string {
  return Array.from(randomBytes.slice(0, 12), (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function isPersonId(value: string | null | undefined): value is string {
  return !!value && /^[a-z2-9]{12}$/.test(value);
}

const sorted = (values: readonly string[]) => [...values].sort().join(",");

/** Whether a shared entry already says the same as the diner's current settings. */
export function sameAllergies(a: MyAllergies, b: MyAllergies): boolean {
  return (
    sorted(a.avoid) === sorted(b.avoid) &&
    sorted(a.alsoAvoid) === sorted(b.alsoAvoid) &&
    a.severity === b.severity
  );
}

export function hasAllergies(mine: MyAllergies): boolean {
  return mine.avoid.length > 0 || mine.alsoAvoid.length > 0;
}

/**
 * Everyone's shared allergies for the server's card: this phone's first, then the rest in a
 * steady order. People without a name are numbered.
 */
export function tableAllergyRows(
  allergies: Record<string, TableAllergyEntry>,
  me: string | null,
  guest: (n: number) => string,
): { person: string; name: string; mine: boolean; entry: TableAllergyEntry }[] {
  const people = Object.keys(allergies).sort((a, b) =>
    a === me ? -1 : b === me ? 1 : a < b ? -1 : 1,
  );
  let unnamed = 0;
  return people.map((person) => {
    const entry = allergies[person];
    const name = entry.label.trim() || guest(++unnamed);
    return { person, name, mine: person === me, entry };
  });
}
