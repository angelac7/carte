/**
 * Helpers for JSON lines: one JSON object per line, sent a piece at a time.
 * The AI writes menus this way so each dish can be shown the moment it's read,
 * and Carte's menu routes stream their results to the browser the same way.
 */

/** Collects streamed text and hands back each line once it's complete. */
export function createLineReader() {
  let buffer = "";
  return {
    /** Adds a chunk of text and returns any lines it completed. */
    push(chunk: string): string[] {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      return lines;
    },
    /** Returns whatever is left once the stream has ended. */
    flush(): string[] {
      const rest = buffer;
      buffer = "";
      return rest.trim() ? [rest] : [];
    },
  };
}

/** Parses one line as a JSON object. Returns null for blank lines, code fences, prose, or broken JSON. */
export function parseJsonLine(line: string): unknown {
  const text = line.trim().replace(/,$/, "");
  if (!text.startsWith("{") || !text.endsWith("}")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
