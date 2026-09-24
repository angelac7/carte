import "server-only";
import fs from "fs";
import path from "path";

/** The public URL of a file in /public if it exists, or null so the page can show a fallback. */
export function publicAsset(relativePath: string): string | null {
  const file = path.join(process.cwd(), "public", relativePath);
  return fs.existsSync(file) ? `/${relativePath}` : null;
}
