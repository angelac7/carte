import { describe, expect, it } from "vitest";
import { matchesSearch, showOriginalName } from "@/lib/menu-search";

describe("menu search", () => {
  const ramyun = ["Wagyu Ramyun", "A rich veal bone broth, raw A5 wagyu, sesame"];

  it("matches every word, ignoring case and accents", () => {
    expect(matchesSearch(ramyun, "wagyu broth")).toBe(true);
    expect(matchesSearch(ramyun, "WAGYU")).toBe(true);
    expect(matchesSearch(["Crème brûlée"], "creme brulee")).toBe(true);
  });

  it("rejects when any word is missing", () => {
    expect(matchesSearch(ramyun, "wagyu tofu")).toBe(false);
  });

  it("shows everything for an empty query", () => {
    expect(matchesSearch(ramyun, "   ")).toBe(true);
  });
});

describe("showing a dish's original name", () => {
  it("hides it when the translation only adds a gloss or changes case", () => {
    expect(
      showOriginalName("Mushroom Ramyun (Korean-style ramen) (V)", "MUSHROOM RAMYUN (V)"),
    ).toBe(false);
    expect(showOriginalName("Gochu (Chili Pepper) Ramyun", "GOCHU RAMYUN")).toBe(false);
    expect(showOriginalName("Tuna Yukhwe (Korean raw tuna) Salad", "TUNA YUKHWE SALAD")).toBe(
      false,
    );
    expect(showOriginalName("Truffle Scallop", "TRUFFLE SCALLOP")).toBe(false);
  });

  it("shows it when the name is genuinely different", () => {
    expect(showOriginalName("Cold noodles", "냉면")).toBe(true);
    expect(showOriginalName("Ramen de cerdo", "Spicy Pork Ramyun")).toBe(true);
  });
});
