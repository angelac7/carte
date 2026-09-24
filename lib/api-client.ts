import type { LanguageCode } from "@/lib/languages";
import type { ExtractedDish, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";
import { MAX_HISTORY, type ChatMessage } from "@/types/chat";

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

/** Thrown when a diner has asked too many questions in a short time. */
export class ChatLimitError extends Error {}

/** Asks the menu assistant a question, sending recent conversation for context. */
export async function askMenu(language: LanguageCode, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, messages: messages.slice(-MAX_HISTORY) }),
  });
  if (res.status === 429) throw new ChatLimitError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.reply !== "string") throw new Error("Chat failed");
  return data.reply;
}
