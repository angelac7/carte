import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/owner/en";
import { fmt, plural } from "@/lib/i18n/owner/format";
import { OWNER_STRINGS } from "@/lib/i18n/owner-strings";
import { LANGUAGES } from "@/lib/languages";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);
const isPlural = (value: object) => Object.keys(value).every((key) => PLURAL_KEYS.has(key));

/** Every text in English and the same text in another language, with where it lives. */
function pairs(english: unknown, other: unknown, path = ""): [string, unknown, unknown][] {
  if (typeof english === "string") return [[path, english, other]];
  if (english && typeof english === "object" && isPlural(english)) return [[path, english, other]];
  return Object.entries(english as object).flatMap(([key, value]) =>
    pairs(value, (other as Record<string, unknown> | undefined)?.[key], `${path}.${key}`),
  );
}

describe("owner dashboard text", () => {
  it("fills in placeholders and picks plural forms", () => {
    expect(fmt("Hi {name}, {missing}", { name: "Mia" })).toBe("Hi Mia, {missing}");
    expect(plural({ one: "1 dish", other: "{count} dishes" }, 1, "en")).toBe("1 dish");
    expect(plural({ one: "1 dish", other: "{count} dishes" }, 3, "en")).toBe("3 dishes");
    expect(plural({ other: "{count}개" }, 1, "ko")).toBe("1개");
  });

  it("gives Arabic counts their own forms for 1, 2, 3–10, and 11–99", () => {
    const counted = pairs(en, OWNER_STRINGS.ar).filter(
      ([, english]) => typeof english !== "string",
    );
    expect(counted.length).toBeGreaterThan(10);
    for (const [path, , forms] of counted)
      for (const form of ["one", "two", "few", "many"])
        expect((forms as Record<string, string>)[form], `ar${path}.${form}`).toBeTruthy();
    expect(plural(OWNER_STRINGS.ar.review.sizes, 2, "ar")).toBe("حجمان");
    expect(plural(OWNER_STRINGS.ar.review.sizes, 14, "ar")).toBe("14 حجمًا");
  });

  for (const { code } of LANGUAGES.filter((language) => language.code !== "en")) {
    it(`has every piece of text in ${code}, with the same placeholders`, () => {
      for (const [path, english, translated] of pairs(en, OWNER_STRINGS[code])) {
        if (typeof english === "string") {
          expect(typeof translated, `${code}${path}`).toBe("string");
          expect((translated as string).trim(), `${code}${path}`).not.toBe("");
          expect(placeholders(translated as string), `${code}${path}`).toEqual(
            placeholders(english),
          );
          if (english.includes("DELETE"))
            expect(translated as string, `${code}${path}`).toContain("DELETE");
        } else {
          const forms = translated as Record<string, string>;
          const wanted = placeholders((english as { other: string }).other);
          expect(forms?.other, `${code}${path}.other`).toBeTruthy();
          expect(placeholders(forms.other), `${code}${path}.other`).toEqual(wanted);
          for (const [form, text] of Object.entries(forms)) {
            expect(PLURAL_KEYS.has(form), `${code}${path}.${form}`).toBe(true);
            for (const name of placeholders(text))
              expect(wanted, `${code}${path}.${form}`).toContain(name);
          }
        }
      }
    });
  }
});
