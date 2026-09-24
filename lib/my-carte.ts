import { z } from "zod";

// Everything here is stored on the diner's own device. Nothing is sent to a server
// except when the diner asks for a taste profile.

const MAX_ITEMS = 200;

const SavedDishSchema = z.object({
  dishId: z.string(),
  name: z.string(),
  description: z.string().catch(""),
  price: z.string().catch(""),
  restaurantName: z.string(),
  restaurantSlug: z.string(),
  cuisine: z.string().catch(""),
  savedAt: z.number(),
});

const SavedRestaurantSchema = z.object({
  slug: z.string(),
  name: z.string(),
  cuisine: z.string().catch(""),
  savedAt: z.number(),
});

const DiaryEntrySchema = z.object({
  dishId: z.string(),
  name: z.string(),
  description: z.string().catch(""),
  price: z.string().catch(""),
  restaurantName: z.string(),
  restaurantSlug: z.string(),
  cuisine: z.string().catch(""),
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).catch(""),
  triedAt: z.number(),
});

const MyCarteSchema = z.object({
  dishes: z.array(SavedDishSchema).catch([]),
  restaurants: z.array(SavedRestaurantSchema).catch([]),
  diary: z.array(DiaryEntrySchema).catch([]),
  menuSizes: z.record(z.string(), z.number()).catch({}),
});

export type SavedDish = z.infer<typeof SavedDishSchema>;
export type SavedRestaurant = z.infer<typeof SavedRestaurantSchema>;
export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
export type MyCarte = z.infer<typeof MyCarteSchema>;

/** The details of a dish worth remembering when a diner saves or rates it. */
export type DishRef = Omit<SavedDish, "savedAt">;
export type RestaurantRef = Omit<SavedRestaurant, "savedAt">;

export const EMPTY_MY_CARTE: MyCarte = { dishes: [], restaurants: [], diary: [], menuSizes: {} };

export function parseMyCarte(raw: string | null): MyCarte {
  if (!raw) return EMPTY_MY_CARTE;
  try {
    return MyCarteSchema.parse(JSON.parse(raw));
  } catch {
    return EMPTY_MY_CARTE;
  }
}

export const isDishSaved = (state: MyCarte, dishId: string) =>
  state.dishes.some((dish) => dish.dishId === dishId);

export const isRestaurantSaved = (state: MyCarte, slug: string) =>
  state.restaurants.some((restaurant) => restaurant.slug === slug);

export const findDiaryEntry = (state: MyCarte, dishId: string) =>
  state.diary.find((entry) => entry.dishId === dishId);

export function toggleSavedDish(state: MyCarte, dish: DishRef, now: number): MyCarte {
  if (isDishSaved(state, dish.dishId)) return removeSavedDish(state, dish.dishId);
  return { ...state, dishes: [{ ...dish, savedAt: now }, ...state.dishes].slice(0, MAX_ITEMS) };
}

export function removeSavedDish(state: MyCarte, dishId: string): MyCarte {
  return { ...state, dishes: state.dishes.filter((dish) => dish.dishId !== dishId) };
}

export function toggleSavedRestaurant(
  state: MyCarte,
  restaurant: RestaurantRef,
  now: number,
): MyCarte {
  if (isRestaurantSaved(state, restaurant.slug))
    return removeSavedRestaurant(state, restaurant.slug);
  return {
    ...state,
    restaurants: [{ ...restaurant, savedAt: now }, ...state.restaurants].slice(0, MAX_ITEMS),
  };
}

export function removeSavedRestaurant(state: MyCarte, slug: string): MyCarte {
  return { ...state, restaurants: state.restaurants.filter((r) => r.slug !== slug) };
}

/** Adds or replaces a diary entry for a dish. */
export function saveDiaryEntry(
  state: MyCarte,
  dish: DishRef,
  rating: number,
  note: string,
  now: number,
): MyCarte {
  const entry: DiaryEntry = {
    ...dish,
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    note: note.trim().slice(0, 500),
    triedAt: findDiaryEntry(state, dish.dishId)?.triedAt ?? now,
  };
  const others = state.diary.filter((e) => e.dishId !== dish.dishId);
  return { ...state, diary: [entry, ...others].slice(0, MAX_ITEMS) };
}

export function removeDiaryEntry(state: MyCarte, dishId: string): MyCarte {
  return { ...state, diary: state.diary.filter((entry) => entry.dishId !== dishId) };
}

/** Remembers how many confirmed dishes a menu has, for the Menu master challenge. */
export function recordMenuSize(state: MyCarte, slug: string, size: number): MyCarte {
  if (state.menuSizes[slug] === size) return state;
  return { ...state, menuSizes: { ...state.menuSizes, [slug]: size } };
}

export const CHALLENGES = [
  "first-bite",
  "critic",
  "regular",
  "explorer",
  "globetrotter",
  "menu-master",
] as const;
export type ChallengeId = (typeof CHALLENGES)[number];
export type Challenge = { id: ChallengeId; progress: number; goal: number; done: boolean };

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

/** Progress toward each challenge, based only on the diner's diary. */
export function computeChallenges(state: MyCarte, now: Date): Challenge[] {
  const { diary, menuSizes } = state;
  const perRestaurant = countBy(diary, (entry) => entry.restaurantSlug);
  const thisMonth = diary.filter((entry) => {
    const tried = new Date(entry.triedAt);
    return tried.getFullYear() === now.getFullYear() && tried.getMonth() === now.getMonth();
  });
  const cuisines = new Set(
    thisMonth.map((entry) => entry.cuisine.trim().toLowerCase()).filter(Boolean),
  );

  // Menu master: the menu the diner is closest to finishing.
  let menuProgress = 0;
  let menuGoal = 0;
  for (const [slug, tried] of perRestaurant) {
    const size = menuSizes[slug];
    if (!size) continue;
    if (menuGoal === 0 || tried / size > menuProgress / menuGoal) {
      menuProgress = Math.min(tried, size);
      menuGoal = size;
    }
  }

  const make = (id: ChallengeId, progress: number, goal: number): Challenge => ({
    id,
    progress: Math.min(progress, goal),
    goal,
    done: goal > 0 && progress >= goal,
  });

  return [
    make("first-bite", diary.length, 1),
    make("critic", diary.length, 10),
    make("regular", Math.max(0, ...perRestaurant.values()), 5),
    make("explorer", perRestaurant.size, 3),
    make("globetrotter", cuisines.size, 5),
    menuGoal > 0 ? make("menu-master", menuProgress, menuGoal) : make("menu-master", 0, 1),
  ];
}

const STOPWORDS = new Set(["and", "with", "the", "our", "for", "from", "house", "served", "fresh"]);

function tokens(text: string): Set<string> {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  return new Set(
    words
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
      .map((word) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word)),
  );
}

/** Dishes on this menu that share the most words with dishes the diner liked or saved. */
export function similarDishes<T extends { id: string; name: string; description: string }>(
  liked: { dishId: string; name: string; description: string }[],
  candidates: T[],
  exclude: Set<string>,
  limit = 3,
): T[] {
  const likedWords = new Set<string>();
  for (const dish of liked)
    for (const word of tokens(`${dish.name} ${dish.description}`)) likedWords.add(word);
  if (likedWords.size === 0) return [];

  return candidates
    .filter((dish) => !exclude.has(dish.id))
    .map((dish) => {
      const words = tokens(`${dish.name} ${dish.description}`);
      const overlap = [...words].filter((word) => likedWords.has(word)).length;
      return { dish, score: words.size ? overlap / Math.sqrt(words.size) : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ dish }) => dish);
}
