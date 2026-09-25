import { describe, expect, it } from "vitest";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/allergens";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { LANGUAGES, languageFromAcceptHeader, textDirection } from "@/lib/languages";
import { SPEECH_LANG } from "@/lib/speak";

describe("more diner languages", () => {
  it("offers 13 languages, with Arabic laid out right to left", () => {
    expect(LANGUAGES.map((language) => language.code)).toEqual([
      "en",
      "es",
      "zh",
      "ko",
      "ja",
      "fr",
      "vi",
      "pt",
      "de",
      "ar",
      "hi",
      "th",
      "tl",
    ]);
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("de")).toBe("ltr");
  });

  it("picks the new languages from a phone's settings, including Filipino", () => {
    expect(languageFromAcceptHeader("pt-BR,pt;q=0.9")).toBe("pt");
    expect(languageFromAcceptHeader("fil-PH")).toBe("tl");
    expect(languageFromAcceptHeader("th-TH,en;q=0.5")).toBe("th");
  });

  it("has fixed allergen, diet, and staff wording in every language, and a voice for each", () => {
    for (const { code } of LANGUAGES) {
      const d = DINER_STRINGS[code];
      for (const allergen of ALLERGENS) expect(d.allergens[allergen].trim()).not.toBe("");
      for (const tag of DIETARY_TAGS) expect(d.tags[tag].trim()).not.toBe("");
      expect(TABLE_STRINGS[code].statement.trim()).not.toBe("");
      expect(TABLE_STRINGS[code].request.trim()).not.toBe("");
      expect(SPEECH_LANG[code]).toMatch(/^[a-z]{2,3}-[A-Z]{2}$/);
    }
  });
});
