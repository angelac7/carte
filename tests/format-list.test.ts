import { describe, expect, it } from "vitest";
import { formatList } from "@/lib/format-list";

describe("formatList", () => {
  it("joins items the way each language does", () => {
    expect(formatList(["milk", "eggs", "fish"], "en")).toBe("milk, eggs, and fish");
  });
});
