import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import type { LanguageCode } from "@/lib/languages";
import type { MenuItem } from "@/types/menu";
import type { DishTranslation, MenuTranslations, TranslatedText } from "@/types/translation";

type CachedTranslation = TranslatedText & { sourceHash: string };
type TranslationStore = Partial<Record<LanguageCode, Record<string, CachedTranslation>>>;

// Temporary file storage for local development, like lib/db/index.ts.
const DATA_FILE = path.join(process.cwd(), "data", "translations.json");

function readStore(): TranslationStore {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as TranslationStore;
}

function writeStore(store: TranslationStore): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

/** A fingerprint of a dish's text, so any owner edit triggers a fresh translation. */
export function sourceHash(dish: Pick<MenuItem, "name" | "description" | "notes">): string {
  return createHash("sha256")
    .update(JSON.stringify([dish.name, dish.description, dish.notes]))
    .digest("hex");
}

/** Splits dishes into those with an up-to-date saved translation and those still missing one. */
export function getCachedTranslations(
  language: LanguageCode,
  dishes: MenuItem[],
): { found: MenuTranslations; missing: MenuItem[] } {
  const saved = readStore()[language] ?? {};
  const found: MenuTranslations = {};
  const missing: MenuItem[] = [];
  for (const dish of dishes) {
    const entry = saved[dish.id];
    if (entry && entry.sourceHash === sourceHash(dish)) {
      found[dish.id] = { name: entry.name, description: entry.description, notes: entry.notes };
    } else {
      missing.push(dish);
    }
  }
  return { found, missing };
}

export function saveTranslations(
  language: LanguageCode,
  dishes: MenuItem[],
  translated: DishTranslation[],
): void {
  const store = readStore();
  const forLanguage = { ...(store[language] ?? {}) };
  const dishesById = new Map(dishes.map((dish) => [dish.id, dish]));
  for (const { id, name, description, notes } of translated) {
    const dish = dishesById.get(id);
    if (dish) forLanguage[id] = { name, description, notes, sourceHash: sourceHash(dish) };
  }
  writeStore({ ...store, [language]: forLanguage });
}
