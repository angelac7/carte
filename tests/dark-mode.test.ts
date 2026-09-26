import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDisplay, serializeDisplay } from "@/lib/display-prefs";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { LANGUAGES } from "@/lib/languages";

const css = readFileSync("app/globals.css", "utf8");

describe("dark mode", () => {
  it("remembers a diner's choice of light or dark, and follows the phone otherwise", () => {
    expect(serializeDisplay({ largeText: false, highContrast: false, theme: "dark" })).toBe("dark");
    expect(parseDisplay("large.dark")).toEqual({
      largeText: true,
      highContrast: false,
      theme: "dark",
    });
    expect(parseDisplay("light")).toMatchObject({ theme: "light" });
    expect(parseDisplay("large")).not.toHaveProperty("theme");
  });

  it("keeps the automatic and chosen dark colors the same", () => {
    const block = (selector: string) => {
      const start = css.indexOf(`${selector} {`);
      return css.slice(start, css.indexOf("}", start)).split("\n").slice(1).join("\n");
    };
    expect(block("html:not(.theme-light)")).toBe(block("html.theme-dark"));
    expect(block("html:not(.theme-light) .texture-ink")).toBe(
      block("html.theme-dark .texture-ink"),
    );
  });

  it("only darkens the screen, so printing stays dark ink on white", () => {
    expect(css).toMatch(/@media screen and \(prefers-color-scheme: dark\)/);
    expect(css).not.toMatch(/@media \(prefers-color-scheme: dark\)/);
  });

  it("has the words for it in every language", () => {
    for (const { code } of LANGUAGES) {
      const t = HELP_STRINGS[code];
      expect(t.colors && t.themeAuto && t.themeLight && t.themeDark).toBeTruthy();
    }
  });
});
