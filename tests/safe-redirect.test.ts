import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it("allows pages on this site", () => {
    expect(safeNextPath("/dashboard/setup")).toBe("/dashboard/setup");
  });

  it("blocks other websites and missing values", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", null]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
});
