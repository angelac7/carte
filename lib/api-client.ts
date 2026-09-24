import type { LanguageCode } from "@/lib/languages";
import type { ExtractedDish, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";

async function sendToItems<T>(method: "POST" | "PUT" | "DELETE", body: unknown): Promise<T> {
  const res = await fetch("/api/items", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchDishes(): Promise<MenuItem[]> {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json() as Promise<MenuItem[]>;
}

export const saveDishes = (items: ExtractedDish[]) => sendToItems<MenuItem[]>("POST", { items });
export const updateDish = (dish: MenuItem) => sendToItems<MenuItem>("PUT", dish);
export const deleteDish = (id: string) => sendToItems<{ ok: boolean }>("DELETE", { id });

/** Sends a menu photo to be read by AI. Throws with a message the user can act on. */
export async function readMenuImage(image: File): Promise<ExtractedDish[]> {
  const form = new FormData();
  form.append("menu", image);
  const res = await fetch("/api/extract", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Carte couldn't read that menu. Try again.");
  return data.items as ExtractedDish[];
}

/** Gets translated dish text for the diner menu. */
export async function fetchTranslations(language: LanguageCode): Promise<MenuTranslations> {
  const res = await fetch(`/api/translations?lang=${encodeURIComponent(language)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Translation failed.");
  return data.translations as MenuTranslations;
}
