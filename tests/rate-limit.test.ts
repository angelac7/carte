import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks until the window resets", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(checkRateLimit(key, 3, 1000, 0)).toBe(true);
    expect(checkRateLimit(key, 3, 1000, 500)).toBe(false);
    expect(checkRateLimit(key, 3, 1000, 1000)).toBe(true);
  });
});
