import type { LanguageCode } from "@/lib/languages";
import { MAX_HISTORY, type ChatMessage } from "@/types/chat";
import type { ExtractedDish, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";
import type { DishInsight } from "@/types/insight";

/** Sends owners to the login page if their session has expired. */
function checkSignedIn(res: Response): void {
  // A full page load is intended: it clears stale state after a session expires,
  // and this helper runs outside React, where useRouter isn't available.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (res.status === 401) window.location.assign("/login");
}

async function sendToItems<T>(method: "POST" | "PUT" | "DELETE", body: unknown): Promise<T> {
  const res = await fetch("/api/items", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  checkSignedIn(res);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchDishes(): Promise<MenuItem[]> {
  const res = await fetch("/api/items");
  checkSignedIn(res);
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
  checkSignedIn(res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Carte couldn't read that menu. Try again.");
  return data.items as ExtractedDish[];
}

/** Gets translated dish text for a restaurant's diner menu. */
export async function fetchTranslations(
  restaurantSlug: string,
  language: LanguageCode,
): Promise<MenuTranslations> {
  const params = new URLSearchParams({ restaurant: restaurantSlug, lang: language });
  const res = await fetch(`/api/translations?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Translation failed.");
  return data.translations as MenuTranslations;
}

/** Thrown when a diner has asked too many questions in a short time. */
export class ChatLimitError extends Error {}

/** Asks a restaurant's menu assistant a question, sending recent conversation for context. */
export async function askMenu(
  restaurantSlug: string,
  language: LanguageCode,
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurant: restaurantSlug,
      language,
      messages: messages.slice(-MAX_HISTORY),
    }),
  });
  if (res.status === 429) throw new ChatLimitError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.reply !== "string") throw new Error("Chat failed");
  return data.reply;
}

/** Gets an explanation of one dish in the diner's language. */
export async function fetchInsight(
  restaurantSlug: string,
  dishId: string,
  language: LanguageCode,
): Promise<DishInsight> {
  const params = new URLSearchParams({ restaurant: restaurantSlug, dish: dishId, lang: language });
  const res = await fetch(`/api/insight?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.insight) throw new Error(data.error ?? "Dish details failed.");
  return data.insight as DishInsight;
}
