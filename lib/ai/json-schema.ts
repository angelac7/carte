// Small builders for structured-output schemas. The API needs every object to list all of
// its fields as required and to forbid extra ones, so `object` always does both.

type Schema = Record<string, unknown>;

export const string: Schema = { type: "string" };
export const integer: Schema = { type: "integer" };

export function list(item: Schema): Schema {
  return { type: "array", items: item };
}

export function oneOf(values: readonly string[]): Schema {
  return { type: "string", enum: [...values] };
}

export function object(properties: Record<string, Schema>): Schema {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  };
}

/** output_config for a structured reply at the given effort. */
export function jsonReply(schema: Schema, effort: "low" | "medium" | "high") {
  return { effort, format: { type: "json_schema" as const, schema } };
}
