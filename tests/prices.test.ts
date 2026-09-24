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

it("handles repeated and international thousands separators", () => {
  expect(parsePrice("1,200,000 ₫")).toBe(1200000);
  expect(parsePrice("1.200 €")).toBe(1200);
  expect(parsePrice("1.234,56 €")).toBe(1234.56);
  expect(parsePrice("$1,234.56")).toBe(1234.56);
  expect(parsePrice("1 234,56 €")).toBe(1234.56);
});

it("leaves ambiguous prices unpriced instead of guessing a bill amount", () => {
  for (const price of ["12 / 18", "$12–18", "2 for $10", "12 18", "1,23,456", "-12"]) {
    expect(parsePrice(price)).toBeNull();
  }
});
