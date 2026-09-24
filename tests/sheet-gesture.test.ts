import { describe, expect, it } from "vitest";
import { shouldDismissSheet } from "@/lib/sheet-gesture";

describe("sheet swipe to close", () => {
  it("closes after a long pull down", () => {
    expect(shouldDismissSheet(160, 0)).toBe(true);
  });

  it("closes after a quick flick down", () => {
    expect(shouldDismissSheet(40, 900)).toBe(true);
  });

  it("stays open after a small or upward drag", () => {
    expect(shouldDismissSheet(60, 200)).toBe(false);
    expect(shouldDismissSheet(-80, -700)).toBe(false);
  });
});
