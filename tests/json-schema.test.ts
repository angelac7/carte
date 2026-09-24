import { describe, expect, it } from "vitest";
import { jsonReply, list, object, oneOf, string } from "@/lib/ai/json-schema";

describe("structured-output schema builders", () => {
  it("makes every object strict, with all fields required", () => {
    expect(object({ name: string, tags: list(oneOf(["vegan"])) })).toEqual({
      type: "object",
      additionalProperties: false,
      required: ["name", "tags"],
      properties: {
        name: { type: "string" },
        tags: { type: "array", items: { type: "string", enum: ["vegan"] } },
      },
    });
  });

  it("wraps a schema with an effort level", () => {
    expect(jsonReply(object({}), "high")).toEqual({
      effort: "high",
      format: {
        type: "json_schema",
        schema: { type: "object", additionalProperties: false, required: [], properties: {} },
      },
    });
  });
});
