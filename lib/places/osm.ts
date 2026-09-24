import "server-only";
import { readPlaceCache, writePlaceCache } from "@/lib/db/place-cache";
import { isValidPlaceId, normalizeElement, type OsmPlace } from "@/lib/places/normalize";

// All map lookups live in this file, so switching to a paid provider later only changes it.
// OpenStreetMap's free servers ask for at most one request per second and a contact email:
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OVERPASS = "https://overpass-api.de/api/interpreter";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const FOOD_PLACES = "restaurant|cafe|fast_food|food_court|ice_cream|bar|pub";

function userAgent(): string {
  const contact = process.env.OSM_CONTACT_EMAIL;
  if (!contact) throw new Error("Missing OSM_CONTACT_EMAIL. Add it to .env.local.");
  return `Carte/0.1 (${contact})`;
}

let nextSlot = 0;

/** Waits so requests leave at most once every 1.1 seconds. */
async function throttle(): Promise<void> {
  const now = Date.now();
  const start = Math.max(now, nextSlot);
  nextSlot = start + 1100;
  if (start > now) await new Promise((resolve) => setTimeout(resolve, start - now));
}

async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
  await throttle();
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": userAgent(), Accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`OpenStreetMap request failed with status ${res.status}`);
  return res.json();
}

async function cached<T>(key: string, maxAgeMs: number, load: () => Promise<T>): Promise<T> {
  const hit = await readPlaceCache(key, maxAgeMs).catch(() => undefined);
  if (hit) return hit.value as T;
  const value = await load();
  await writePlaceCache(key, value).catch(() => {});
  return value;
}

async function overpass(query: string): Promise<unknown[]> {
  const data = (await fetchJson(OVERPASS, {
    method: "POST",
    body: new URLSearchParams({ data: query }),
  })) as { elements?: unknown[] };
  return data.elements ?? [];
}

/** Finds the center of a city or neighborhood. */
export async function geocode(near: string): Promise<{ lat: number; lon: number } | null> {
  const query = near.trim().toLowerCase().slice(0, 100);
  if (!query) return null;
  return cached(`geocode:${query}`, MONTH_MS, async () => {
    const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
    const results = (await fetchJson(`${NOMINATIM}/search?${params}`)) as {
      lat: string;
      lon: string;
    }[];
    const first = results[0];
    return first ? { lat: Number(first.lat), lon: Number(first.lon) } : null;
  });
}

/** Restaurants and cafes within a radius, optionally matching a name or cuisine. */
export async function searchPlaces(
  center: { lat: number; lon: number },
  search: string,
  radiusMeters = 5000,
): Promise<OsmPlace[]> {
  const lat = center.lat.toFixed(3);
  const lon = center.lon.toFixed(3);
  // Keep only letters, numbers, spaces, and apostrophes so the query can't be misread.
  const words = search
    .replace(/[^\p{L}\p{N}' -]/gu, "")
    .trim()
    .toLowerCase()
    .slice(0, 60);

  return cached(`search:${lat},${lon}:${radiusMeters}:${words}`, WEEK_MS, async () => {
    const around = `(around:${radiusMeters},${lat},${lon})`;
    const base = `nwr["amenity"~"^(${FOOD_PLACES})$"]["name"]`;
    const body = words
      ? `${base}["name"~"${words}",i]${around};${base}["cuisine"~"${words}",i]${around};`
      : `${base}${around};`;
    const elements = await overpass(`[out:json][timeout:15];(${body});out tags center 80;`);
    const unique = new Map<string, OsmPlace>();
    for (const element of elements) {
      const place = normalizeElement(element);
      if (place) unique.set(place.id, place);
    }
    return [...unique.values()];
  });
}

/** One real restaurant by its OpenStreetMap id, like "node-123456". */
export async function getPlace(id: string): Promise<OsmPlace | null> {
  if (!isValidPlaceId(id)) return null;
  const [type, number] = id.split("-");
  return cached(`place:${id}`, WEEK_MS, async () => {
    const elements = await overpass(`[out:json][timeout:15];${type}(${number});out tags center;`);
    return elements.length > 0 ? normalizeElement(elements[0]) : null;
  });
}
