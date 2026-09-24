import type { LanguageCode } from "@/lib/languages";
import { MAX_HISTORY, type ChatMessage } from "@/types/chat";
import type { ExtractedDish, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";
import type { PhotoMatch, ScannedMenu } from "@/types/camera";
import type { TasteProfile, TasteRequest } from "@/types/taste";
import type { Recommendation, RecommendRequest } from "@/types/recommend";
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

/** Asks for dish suggestions that respect the diner's filters. */
export async function askForPicks(request: RecommendRequest): Promise<Recommendation> {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.recommendation) throw new Error("Suggestions failed");
  return data.recommendation as Recommendation;
}

/** Counts a dish view for trending. Never blocks the diner or shows errors. */
export function trackDishView(dishId: string): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish: dishId }),
    keepalive: true,
  }).catch(() => {});
}

/** Asks for a taste profile built from the diner's own ratings and saved dishes. */
export async function requestTasteProfile(request: TasteRequest): Promise<TasteProfile> {
  const res = await fetch("/api/taste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.profile) throw new Error("Taste profile failed");
  return data.profile as TasteProfile;
}

/** Thrown when a visitor has used a photo feature too many times recently. */
export class PhotoLimitError extends Error {}

/** Finds which dish on a restaurant's menu a photo shows. */
export async function askPhotoMatch(
  restaurantSlug: string,
  language: LanguageCode,
  image: File,
): Promise<PhotoMatch[]> {
  const form = new FormData();
  form.append("restaurant", restaurantSlug);
  form.append("lang", language);
  form.append("image", image);
  const res = await fetch("/api/photo-match", { method: "POST", body: form });
  if (res.status === 429) throw new PhotoLimitError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.matches)) throw new Error("Photo match failed");
  return data.matches as PhotoMatch[];
}

/** Reads and translates a paper menu photo. */
export async function scanMenu(language: LanguageCode, image: File): Promise<ScannedMenu> {
  const form = new FormData();
  form.append("lang", language);
  form.append("image", image);
  const res = await fetch("/api/scan", { method: "POST", body: form });
  if (res.status === 429) throw new PhotoLimitError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.menu) throw new Error("Scan failed");
  return data.menu as ScannedMenu;
}

/** Uploads a photo for one of the owner's dishes and returns its address. */
export async function uploadDishPhoto(dishId: string, image: File): Promise<string> {
  const form = new FormData();
  form.append("dish", dishId);
  form.append("image", image);
  const res = await fetch("/api/dish-photo", { method: "POST", body: form });
  checkSignedIn(res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.photoUrl !== "string") throw new Error(data.error ?? "Upload failed");
  return data.photoUrl;
}

export async function removeDishPhoto(dishId: string): Promise<void> {
  const res = await fetch("/api/dish-photo", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish: dishId }),
  });
  checkSignedIn(res);
  if (!res.ok) throw new Error("Removing the photo failed");
}

/** Deletes every dish on the owner's menu, for example before uploading a new one. */
export const deleteAllDishes = () => sendToItems<{ ok: boolean }>("DELETE", { all: true });
