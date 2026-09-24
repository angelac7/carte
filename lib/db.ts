import fs from "fs";
import path from "path";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  allergens: string[];
  dietary_tags: string[];
  notes: string;
  confirmed: boolean;
};

const file = path.join(process.cwd(), "data", "menu.json");

export function readItems(): MenuItem[] {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeItems(items: MenuItem[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}