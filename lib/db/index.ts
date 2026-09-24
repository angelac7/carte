import fs from "fs";
import path from "path";
import type { MenuItem } from "@/types/menu";

// Temporary file storage for local development. Replaced by a hosted database at launch.
const DATA_FILE = path.join(process.cwd(), "data", "menu.json");

export function readItems(): MenuItem[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as MenuItem[];
}

export function writeItems(items: MenuItem[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}
