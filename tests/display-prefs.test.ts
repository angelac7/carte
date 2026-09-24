import { describe, expect, it } from "vitest";
import { DEFAULT_DISPLAY, parseDisplay, serializeDisplay } from "@/lib/display-prefs";

describe("display preferences", () => {
  it("round-trips larger text and high contrast", () => {
    const prefs = { largeText: true, highContrast: true };
    expect(parseDisplay(serializeDisplay(prefs))).toEqual(prefs);
  });

  it("falls back to the default display", () => {
    expect(parseDisplay(undefined)).toEqual(DEFAULT_DISPLAY);
    expect(parseDisplay(serializeDisplay(DEFAULT_DISPLAY))).toEqual(DEFAULT_DISPLAY);
  });
});
