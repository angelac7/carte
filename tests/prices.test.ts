import { describe, expect, it } from "vitest";
import { detectCurrency, formatMoney, parsePrice } from "@/lib/prices";

describe("parsePrice", () => {
  it("reads common menu price formats", () => {
    expect(parsePrice("57")).toBe(57);
    expect(parsePrice("$12.50")).toBe(12.5);
    expect(parsePrice("12,50 €")).toBe(12.5);
    expect(parsePrice("Market price")).toBeNull();
  });

  it("treats commas before three digits as thousands", () => {
    expect(parsePrice("₩1,200")).toBe(1200);
  });
});

describe("currency", () => {
  it("uses the menu's symbol, or dollars when there is none", () => {
    expect(detectCurrency(["28", "€14"])).toBe("€");
    expect(detectCurrency(["28", "41"])).toBe("$");
    expect(formatMoney(12.5, "$")).toBe("$12.50");
  });
});
