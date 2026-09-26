import { expect, it } from "vitest";
import { publishChecklist, reviewDue, translationComplete } from "@/lib/publish-checklist";
import { translationHash } from "@/lib/source-hash";
import type { MenuItem } from "@/types/menu";
const dish: MenuItem = {
  id: "d",
  name: "Soup",
  description: "Hot soup",
  notes: "Shared pan",
  price: "$8",
  allergens: [],
  dietary_tags: [],
  confirmed: true,
  allergen_list: 2,
  also_checked: true,
  source_language: "en",
};
const now = Date.parse("2026-09-26T12:00:00Z");
it("flags missing, invalid and 90-day-old reviews without expiring recent reviews", () => {
  expect(reviewDue(undefined, now)).toBe(true);
  expect(reviewDue("bad date", now)).toBe(true);
  expect(reviewDue(new Date(now + 1).toISOString(), now)).toBe(true);
  expect(reviewDue(new Date(now - 90 * 86400000).toISOString(), now)).toBe(true);
  expect(reviewDue(new Date(now - 89 * 86400000).toISOString(), now)).toBe(false);
});
it("requires notes and option translations even when a source fingerprint matches", () => {
  const optionDish = { ...dish, sizes: [{ label: "Large", price: "$12" }] };
  const row = {
    menu_item_id: "d",
    source_hash: translationHash(optionDish),
    name: "Sopa",
    description: "Caliente",
    notes: "Sartén compartida",
    section: "",
    options: ["Grande"],
  };
  expect(translationComplete(optionDish, row)).toBe(true);
  expect(translationComplete(optionDish, { ...row, notes: " " })).toBe(false);
  expect(translationComplete(optionDish, { ...row, options: [] })).toBe(false);
  expect(translationComplete(optionDish, { ...row, source_hash: "old" })).toBe(false);
});
it("separates optional notes, legacy confirmation, dietary conflicts and translation gaps", () => {
  const items = [
    dish,
    { ...dish, id: "draft", confirmed: false, notes: "" },
    { ...dish, id: "legacy", allergen_list: 1 },
    {
      ...dish,
      id: "conflict",
      allergens: ["milk"] as MenuItem["allergens"],
      dietary_tags: ["vegan"] as MenuItem["dietary_tags"],
    },
  ];
  const result = publishChecklist(items, { d: new Date(now).toISOString() }, [], "en", now);
  expect(result.unconfirmed.map((d) => d.id)).toEqual(["draft", "legacy"]);
  expect(result.notes.map((d) => d.id)).toEqual(["draft"]);
  expect(result.conflicts.map((d) => d.id)).toEqual(["conflict"]);
  expect(result.translations).toEqual([]);
  expect(result.due.map((d) => d.id)).toEqual(["legacy", "conflict"]);
  expect(publishChecklist(items, {}, [], "es", now).translations).toHaveLength(3);
  expect(items[0].confirmed).toBe(true);
});
