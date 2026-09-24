import { describe, expect, it } from "vitest";
import { cleanTerms } from "@/lib/ai/craving";
import { DEFAULT_HOURS, isOpenNow, ProfileSchema, DEFAULT_PROFILE } from "@/lib/restaurant-profile";

const NY = "America/New_York";

describe("isOpenNow", () => {
  it("is open during regular hours", () => {
    // Monday, September 21, 2026 at 12:00 in New York
    const hours = { mon: { open: "11:00", close: "21:00" } };
    expect(isOpenNow(hours, NY, new Date("2026-09-21T16:00:00Z"))).toBe(true);
  });

  it("is closed after closing time", () => {
    // Monday at 22:00 in New York
    const hours = { mon: { open: "11:00", close: "21:00" } };
    expect(isOpenNow(hours, NY, new Date("2026-09-22T02:00:00Z"))).toBe(false);
  });

  it("stays open past midnight when hours run late", () => {
    // Friday 18:00 to 2:00; checked Saturday at 1:00 in New York
    const hours = { fri: { open: "18:00", close: "02:00" }, sat: null };
    expect(isOpenNow(hours, NY, new Date("2026-09-26T05:00:00Z"))).toBe(true);
  });

  it("is unknown when no hours are set", () => {
    expect(isOpenNow({}, NY)).toBeNull();
  });
});

describe("ProfileSchema", () => {
  it("rejects invalid times", () => {
    const bad = {
      ...DEFAULT_PROFILE,
      hours: { ...DEFAULT_HOURS, mon: { open: "25:00", close: "21:00" } },
    };
    expect(ProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("cleanTerms", () => {
  it("keeps short plain words and drops anything odd", () => {
    expect(cleanTerms(["Soup", "ramen", "soup", "DROP TABLE;", "a", "hot pot"])).toEqual([
      "soup",
      "ramen",
      "hot pot",
    ]);
  });
});
