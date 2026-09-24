import { describe, expect, it } from "vitest";
import { createListItemReader, parseJson } from "@/lib/json-stream";

const reply =
  '{"menuLanguage":"en","dishes":[{"name":"Pho {large}","allergens":["fish"]},' +
  '{"name":"Say \\"cheese\\" toast","allergens":["milk","wheat"]},{"name":"Rice","allergens":[]}]}';

describe("list item reader", () => {
  it("returns each list item once it is complete", () => {
    const reader = createListItemReader();
    const items = reader.push(reply).map(parseJson);
    expect(items).toEqual([
      { name: "Pho {large}", allergens: ["fish"] },
      { name: 'Say "cheese" toast', allergens: ["milk", "wheat"] },
      { name: "Rice", allergens: [] },
    ]);
  });

  it("gives the same items however the text is split", () => {
    for (const size of [1, 2, 3, 7, 13]) {
      const reader = createListItemReader();
      const items: string[] = [];
      for (let start = 0; start < reply.length; start += size) {
        items.push(...reader.push(reply.slice(start, start + size)));
      }
      expect(items.map(parseJson)).toEqual(createListItemReader().push(reply).map(parseJson));
    }
  });

  it("returns nothing until an item closes", () => {
    const reader = createListItemReader();
    expect(reader.push('{"items":[{"name":"Pho","price":"$1')).toEqual([]);
    expect(reader.push('4"},')).toEqual(['{"name":"Pho","price":"$14"}']);
  });

  it("ignores text outside the JSON, like a code fence", () => {
    const reader = createListItemReader();
    expect(reader.push('```json\n{"items":[{"name":"Pho"}]}\n```').map(parseJson)).toEqual([
      { name: "Pho" },
    ]);
  });
});

describe("parseJson", () => {
  it("returns null for broken JSON", () => {
    expect(parseJson('{"name":')).toBeNull();
    expect(parseJson('{"name":"Pho"}')).toEqual({ name: "Pho" });
  });
});
