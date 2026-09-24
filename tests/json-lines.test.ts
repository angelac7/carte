import { describe, expect, it } from "vitest";
import { createLineReader, parseJsonLine } from "@/lib/json-lines";

describe("line reader", () => {
  it("returns lines only once they are complete", () => {
    const reader = createLineReader();
    expect(reader.push('{"name":"Pho')).toEqual([]);
    expect(reader.push('"}\n{"name":')).toEqual(['{"name":"Pho"}']);
    expect(reader.push('"Banh mi"}\n')).toEqual(['{"name":"Banh mi"}']);
    expect(reader.flush()).toEqual([]);
  });

  it("hands back a last line that has no newline", () => {
    const reader = createLineReader();
    reader.push('{"a":1}\n{"b":2}');
    expect(reader.flush()).toEqual(['{"b":2}']);
  });

  it("returns several lines from one chunk", () => {
    const reader = createLineReader();
    expect(reader.push('{"a":1}\n{"b":2}\n{"c"')).toEqual(['{"a":1}', '{"b":2}']);
  });
});

describe("parsing a JSON line", () => {
  it("parses an object, even with Windows line endings or a trailing comma", () => {
    expect(parseJsonLine('{"name":"Pho"}\r')).toEqual({ name: "Pho" });
    expect(parseJsonLine('  {"name":"Pho"},')).toEqual({ name: "Pho" });
  });

  it("skips blank lines, code fences, prose, and broken JSON", () => {
    expect(parseJsonLine("")).toBeNull();
    expect(parseJsonLine("```json")).toBeNull();
    expect(parseJsonLine("Here are the dishes I can see:")).toBeNull();
    expect(parseJsonLine('{"name":"Pho",')).toBeNull();
    expect(parseJsonLine('{"name":}')).toBeNull();
  });
});
