import { describe, expect, it } from "vitest";
import { requestedNextPath, safeNextPath } from "@/lib/safe-redirect";

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

describe("requestedNextPath", () => {
  it("keeps a page on this site and drops anything else", () => {
    expect(requestedNextPath("/dashboard/upload")).toBe("/dashboard/upload");
    for (const bad of [undefined, "", "https://evil.example", "//evil.example"]) {
      expect(requestedNextPath(bad)).toBeUndefined();
    }
  });
});
