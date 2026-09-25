import { describe, expect, it } from "vitest";
import { dishNameKey, withoutDuplicates } from "@/lib/menu-dedupe";

describe("duplicate dishes on upload", () => {
  it("treats names that differ only in case, spacing, or width as the same", () => {
    expect(dishNameKey("  MUSHROOM   Ramyun (V) ")).toBe(dishNameKey("mushroom ramyun (v)"));
    expect(dishNameKey("ＴＯＲＯ ssam bap")).toBe(dishNameKey("toro ssam bap"));
  });

  it("skips dishes already on the menu and repeats within the same upload", () => {
    const incoming = [
      { name: "Toro Ssam Bap" },
      { name: "Wagyu Ramyun" },
      { name: "WAGYU RAMYUN" },
      { name: "  " },
    ];
    expect(withoutDuplicates(["TORO SSAM BAP"], incoming)).toEqual([{ name: "Wagyu Ramyun" }]);
  });

  it("keeps everything when nothing repeats", () => {
    expect(withoutDuplicates([], [{ name: "Pho" }, { name: "Banh mi" }])).toHaveLength(2);
  });
});
