import { describe, expect, it } from "vitest";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/allergens";
import { sourceHash } from "@/lib/source-hash";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { languageFromAcceptHeader, LANGUAGES, matchBrowserLanguage } from "@/lib/languages";

describe("language detection", () => {
  it("picks the first supported language from the browser header", () => {
    expect(languageFromAcceptHeader("ko-KR,ko;q=0.9,en-US;q=0.8")).toBe("ko");
  });

  it("falls back to English for unsupported or missing languages", () => {
    expect(languageFromAcceptHeader("it-IT,it;q=0.9")).toBe("en");
    expect(languageFromAcceptHeader("")).toBe("en");
  });

  it("matches regional variants to the base language", () => {
    expect(matchBrowserLanguage(["zh-CN"])).toBe("zh");
    expect(matchBrowserLanguage(["es-MX"])).toBe("es");
  });
});

describe("fixed translations", () => {
  it("has a non-empty name for every allergen and tag in every language", () => {
    for (const { code } of LANGUAGES) {
      for (const allergen of ALLERGENS)
        expect(DINER_STRINGS[code].allergens[allergen]).not.toBe("");
      for (const tag of DIETARY_TAGS) expect(DINER_STRINGS[code].tags[tag]).not.toBe("");
    }
  });
});

describe("sourceHash", () => {
  const dish = { name: "Ramyun", description: "Pork broth", notes: "" };

  it("stays the same when the text is unchanged", () => {
    expect(sourceHash(dish)).toBe(sourceHash({ ...dish }));
  });

  it("changes when an owner edits the notes, so the dish is retranslated", () => {
    expect(sourceHash({ ...dish, notes: "Shared fryer" })).not.toBe(sourceHash(dish));
  });
});
