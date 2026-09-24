/**
 * Reads a JSON object like {"items":[{...},{...}]} while it's still being written, and hands
 * back each object in its lists as soon as that object is complete. This lets a menu written
 * as one strict JSON reply still show each dish the moment it's read.
 */
export function createListItemReader() {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let item: string | null = null;

  return {
    /** Adds a chunk of text and returns the JSON text of any list items it completed. */
    push(chunk: string): string[] {
      const done: string[] = [];
      for (const char of chunk) {
        if (item !== null) item += char;
        if (inString) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') inString = false;
          continue;
        }
        if (char === '"') {
          inString = true;
        } else if (char === "{" || char === "[") {
          depth++;
          // Depth 1 is the outer object, 2 a list inside it, 3 an object in that list.
          if (depth === 3 && char === "{" && item === null) item = "{";
        } else if (char === "}" || char === "]") {
          depth--;
          if (depth === 2 && char === "}" && item !== null) {
            done.push(item);
            item = null;
          }
        }
      }
      return done;
    },
  };
}

/** Parses JSON text, returning null instead of throwing when it's broken. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
