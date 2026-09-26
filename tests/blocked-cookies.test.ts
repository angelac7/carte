// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { currentPrefsValue, EMPTY_PREFS, parsePrefs, writePrefsCookie } from "@/lib/diner-prefs";

describe("filters when the browser won't keep cookies", () => {
  it("still apply for the visit, like on a menu inside a restaurant's website", () => {
    const real = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")!;
    // A browser that refuses every cookie, as many do inside another site's frame.
    Object.defineProperty(document, "cookie", { configurable: true, get: () => "", set: () => {} });
    try {
      expect(parsePrefs(currentPrefsValue())).toEqual(EMPTY_PREFS);
      writePrefsCookie({ ...EMPTY_PREFS, avoid: ["peanuts"] });
      expect(parsePrefs(currentPrefsValue()).avoid).toEqual(["peanuts"]);
    } finally {
      Object.defineProperty(document, "cookie", real);
    }
  });

  it("use the cookie itself when the browser keeps it", () => {
    writePrefsCookie({ ...EMPTY_PREFS, avoid: ["milk"] });
    expect(document.cookie).toContain("carte-prefs=");
    expect(parsePrefs(currentPrefsValue()).avoid).toEqual(["milk"]);
  });
});
