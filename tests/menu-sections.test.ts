import { describe, expect, it } from "vitest";
import { groupBySection, hasSections, moveDish, moveSection } from "@/lib/menu-sections";

const dish = (id: string, section?: string) => ({ id, section });
const ids = (dishes: { id: string }[]) => dishes.map((d) => d.id);

describe("menu sections", () => {
  const menu = [dish("a", "Starters"), dish("b", "Mains"), dish("c", "Starters"), dish("d")];

  it("groups dishes under headings in the order each first appears", () => {
    const groups = groupBySection(menu);
    expect(groups.map((group) => group.section)).toEqual(["Starters", "Mains", ""]);
    expect(ids(groups[0].dishes)).toEqual(["a", "c"]);
    expect(hasSections(groups)).toBe(true);
    expect(hasSections(groupBySection([dish("x"), dish("y", "  ")]))).toBe(false);
  });

  it("moves a dish within its section only", () => {
    expect(ids(moveDish(menu, "c", -1))).toEqual(["c", "a", "b", "d"]);
    expect(ids(moveDish(menu, "a", -1))).toEqual(["a", "c", "b", "d"]);
    expect(ids(moveDish(menu, "b", 1))).toEqual(["a", "c", "b", "d"]);
  });

  it("moves whole sections with their dishes", () => {
    expect(ids(moveSection(menu, 1, -1))).toEqual(["b", "a", "c", "d"]);
    expect(ids(moveSection(menu, 2, 1))).toEqual(["a", "c", "b", "d"]);
  });
});
