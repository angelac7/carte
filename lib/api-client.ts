import { prepareChatHistory } from "@/lib/chat-history";
import type { DishSummaries } from "@/lib/dish-summaries";
import type { DinerFilters } from "@/lib/menu-filters";
import { createLineReader, parseJsonLine } from "@/lib/json-lines";
import type { LanguageCode } from "@/lib/languages";
import { ChatStreamEventSchema, type ChatMessage } from "@/types/chat";
import type { ExtractedDish, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";
import type { PhotoMatch, ScannedDish } from "@/types/camera";
import { MenuStreamEventSchema, ScanStreamEventSchema } from "@/types/menu-stream";
import type { TasteProfile, TasteRequest } from "@/types/taste";
import type { Recommendation, RecommendRequest } from "@/types/recommend";
import type { DishInsight } from "@/types/insight";
import type { ReportRequest } from "@/types/report";

/** Sends owners to the login page if their session has expired. */
function checkSignedIn(res: Response): void {
  // A full page load is intended: it clears stale state after a session expires,
  // and this helper runs outside React, where useRouter isn't available.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (res.status === 401) window.location.assign("/login");
}

async function sendToItems<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
): Promise<T> {
  const res = await fetch("/api/items", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  checkSignedIn(res);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchDishes(): Promise<MenuItem[]> {
  const res = await fetch("/api/items");
  checkSignedIn(res);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<MenuItem[]>;
}

/** Saves dishes and returns the ones added. With `skipExisting`, dishes already on the menu are left out. */
export const saveDishes = (items: ExtractedDish[], options: { skipExisting?: boolean } = {}) =>
  sendToItems<MenuItem[]>("POST", { items, ...options });
export const updateDish = (dish: MenuItem) => sendToItems<MenuItem>("PUT", dish);
/** Saves a new dish order; returns the dishes whose order changed, with their new versions. */
export const reorderDishes = (order: string[]) =>
  sendToItems<{ id: string; revision: number; sort_order: number }[]>("PATCH", { order });
/** Marks a dish sold out for today, or available again. Returns the updated dish. */
export async function setDishSoldOut(id: string, soldOut: boolean): Promise<MenuItem> {
  const res = await fetch("/api/items/sold-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, soldOut }),
  });
  checkSignedIn(res);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "That dish couldn't be updated.");
  return body as MenuItem;
}
export const deleteDish = (id: string, revision?: number) =>
  sendToItems<{ ok: boolean }>("DELETE", { id, revision });

/** Calls `onLine` with each parsed line of a streamed JSON-lines response, as it arrives. */
async function readJsonLines(res: Response, onLine: (value: unknown) => void): Promise<void> {
  if (!res.body) throw new Error("No response");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const lines = createLineReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const line of lines.push(decoder.decode(value, { stream: true })))
        onLine(parseJsonLine(line));
    }
    for (const line of lines.flush()) onLine(parseJsonLine(line));
  } finally {
    reader.cancel().catch(() => {});
  }
}

const MENU_STOPPED = "Carte stopped before reading the whole menu. Try again.";

/**
 * Sends a menu photo to be read by AI, calling `onDish` as each dish is read.
 * Throws with a message the user can act on.
 */
export async function streamMenuImage(
  image: File,
  onDish: (dish: ExtractedDish) => void,
): Promise<void> {
  const form = new FormData();
  form.append("menu", image);
  const res = await fetch("/api/extract", { method: "POST", body: form });
  checkSignedIn(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Carte couldn't read that menu. Try again.");
  }
  let finished = false;
  await readJsonLines(res, (value) => {
    const event = MenuStreamEventSchema.safeParse(value);
    if (!event.success) return;
    if (event.data.type === "dish") onDish(event.data.dish);
    else if (event.data.type === "error") throw new Error(event.data.message);
    else finished = true;
  });
  if (!finished) throw new Error(MENU_STOPPED);
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
/**
 * Asks the menu assistant a question, calling `onText` with the answer so far as it's
 * written. Returns the full answer.
 */
export async function streamMenuAnswer(
  restaurantSlug: string,
  language: LanguageCode,
  messages: ChatMessage[],
  onText: (answer: string) => void,
  filters: DinerFilters,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurant: restaurantSlug,
      language,
      messages: prepareChatHistory(messages),
      ...filters,
    }),
  });
  if (res.status === 429) throw new ChatLimitError();
  if (!res.ok) throw new Error("Chat failed");
  let answer = "";
  let finished = false;
  await readJsonLines(res, (value) => {
    const event = ChatStreamEventSchema.safeParse(value);
    if (!event.success) return;
    if (event.data.type === "text") onText((answer += event.data.text));
    else if (event.data.type === "error") throw new Error("Chat failed");
    else finished = true;
  });
  if (!finished || !answer.trim()) throw new Error("Chat failed");
  return answer.trim();
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

/** Short explanations already written for this menu in a language. Never waits on AI. */
export async function fetchSummaries(
  restaurantSlug: string,
  language: LanguageCode,
): Promise<DishSummaries> {
  const params = new URLSearchParams({ restaurant: restaurantSlug, lang: language });
  const res = await fetch(`/api/summaries?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.summaries) throw new Error(data.error ?? "Summaries failed.");
  return data.summaries as DishSummaries;
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

/** Tells the restaurant a dish's details look wrong. Throws if the report wasn't saved. */
export async function sendDishReport(report: ReportRequest): Promise<void> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error("Report failed.");
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
  filters: DinerFilters,
): Promise<PhotoMatch[]> {
  const form = new FormData();
  form.append("restaurant", restaurantSlug);
  form.append("lang", language);
  form.append("image", image);
  for (const allergen of filters.avoid) form.append("avoid", allergen);
  for (const tag of filters.onlyTags) form.append("onlyTags", tag);
  const res = await fetch("/api/photo-match", { method: "POST", body: form });
  if (res.status === 429) throw new PhotoLimitError();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.matches)) throw new Error("Photo match failed");
  return data.matches as PhotoMatch[];
}

type ScanHandlers = {
  onLanguage: (menuLanguage: string) => void;
  onDish: (dish: ScannedDish) => void;
};

/** Reads and translates a paper menu photo, calling the handlers as each part is read. */
export async function streamScan(
  language: LanguageCode,
  image: File,
  { onLanguage, onDish }: ScanHandlers,
): Promise<boolean> {
  const form = new FormData();
  form.append("lang", language);
  form.append("image", image);
  const res = await fetch("/api/scan", { method: "POST", body: form });
  if (res.status === 429) throw new PhotoLimitError();
  if (!res.ok) throw new Error("Scan failed");
  let finished = false;
  let partial = false;
  await readJsonLines(res, (value) => {
    const event = ScanStreamEventSchema.safeParse(value);
    if (!event.success) return;
    if (event.data.type === "language") onLanguage(event.data.menuLanguage);
    else if (event.data.type === "dish") onDish(event.data.dish);
    else if (event.data.type === "partial") partial = true;
    else if (event.data.type === "error") throw new Error("Scan failed");
    else finished = true;
  });
  if (!finished) throw new Error("Scan failed");
  return partial;
}

/** Uploads a photo for one of the owner's dishes and returns its address. */
export async function uploadDishPhoto(
  dishId: string,
  image: File,
  revision?: number,
): Promise<{ photoUrl: string; revision: number }> {
  const form = new FormData();
  form.append("dish", dishId);
  form.append("revision", String(revision ?? ""));
  form.append("image", image);
  const res = await fetch("/api/dish-photo", { method: "POST", body: form });
  checkSignedIn(res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.photoUrl !== "string") throw new Error(data.error ?? "Upload failed");
  return data;
}

export async function removeDishPhoto(
  dishId: string,
  revision?: number,
): Promise<{ revision: number }> {
  const res = await fetch("/api/dish-photo", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish: dishId, revision }),
  });
  checkSignedIn(res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Removing the photo failed");
  return data;
}

/** Deletes every dish on the owner's menu, for example before uploading a new one. */
export const deleteAllDishes = (dishes: MenuItem[]) =>
  sendToItems<{ ok: boolean }>("DELETE", {
    all: true,
    expected: dishes.map(({ id, revision }) => ({ id, revision })),
  });
