import type { DietaryTag } from "@/lib/allergens";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import { WEEKDAYS, type FullHours, type Weekday } from "@/lib/restaurant-profile";

/** A real restaurant from OpenStreetMap. None of this is confirmed by the restaurant. */
export type OsmPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  amenity: string;
  cuisine: string[];
  address: string;
  city: string;
  openingHours: string;
  website: string;
  phone: string;
  diets: DietaryTag[];
};

export const FOOD_AMENITIES = [
  "restaurant",
  "cafe",
  "fast_food",
  "food_court",
  "ice_cream",
  "bar",
  "pub",
] as const;

const PLACE_ID = /^(node|way|relation)-\d{1,15}$/;

export function isValidPlaceId(id: string): boolean {
  return PLACE_ID.test(id);
}

/** Only http(s) links, so map data can never inject a script link. */
export function safeUrl(raw: string | undefined): string {
  if (!raw) return "";
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function safePhone(raw: string | undefined): string {
  if (!raw) return "";
  const phone = raw.split(";")[0].trim();
  const digits = phone.replace(/\D/g, "");
  return /^[+\d\s().-]+$/.test(phone) && digits.length >= 7 ? phone : "";
}

/** "korean;ramen_noodles" becomes ["Korean", "Ramen noodles"]. */
export function formatCuisine(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((part) => part.trim().replace(/_/g, " "))
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .slice(0, 4);
}

const DIET_KEYS: [string, DietaryTag][] = [
  ["diet:vegan", "vegan"],
  ["diet:vegetarian", "vegetarian"],
  ["diet:gluten_free", "gluten-free"],
  ["diet:halal", "halal"],
  ["diet:kosher", "kosher"],
];

type OsmElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/** Turns a raw OpenStreetMap element into a place, or null if it's missing essentials. */
export function normalizeElement(raw: unknown): OsmPlace | null {
  const element = raw as OsmElement | null;
  if (!element || !["node", "way", "relation"].includes(element.type ?? "")) return null;
  if (typeof element.id !== "number" || !Number.isSafeInteger(element.id) || element.id < 1)
    return null;
  const tags = element.tags ?? {};
  if (
    typeof tags.name !== "string" ||
    !tags.name.trim() ||
    !(FOOD_AMENITIES as readonly string[]).includes(tags.amenity)
  )
    return null;
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  )
    return null;

  return {
    id: `${element.type}-${element.id}`,
    name: tags.name.slice(0, 120),
    lat,
    lon,
    amenity: tags.amenity ?? "",
    cuisine: formatCuisine(tags.cuisine),
    address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    city: tags["addr:city"] ?? "",
    openingHours: (tags.opening_hours ?? "").slice(0, 200),
    website: safeUrl(tags.website ?? tags["contact:website"]),
    phone: safePhone(tags.phone ?? tags["contact:phone"]),
    diets: DIET_KEYS.filter(([key]) => ["yes", "only"].includes(tags[key] ?? "")).map(
      ([, tag]) => tag,
    ),
  };
}

/** Straight-line distance in meters between two points. */
export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Miles for English readers, kilometers for everyone else. */
export function formatDistance(meters: number, language: LanguageCode): string {
  const useMiles = language === "en";
  return new Intl.NumberFormat(htmlLang(language), {
    style: "unit",
    unit: useMiles ? "mile" : "kilometer",
    maximumFractionDigits: 1,
  }).format(useMiles ? meters / 1609.34 : meters / 1000);
}

export function coordinatesUrl(place: { lat: number; lon: number }): string {
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
}

const DAY_CODES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function expandDays(spec: string): Weekday[] | null {
  const days: Weekday[] = [];
  for (const part of spec.replace(/\s/g, "").split(",")) {
    const [start, end] = part.split("-");
    const first = DAY_CODES.indexOf(start);
    const last = end === undefined ? first : DAY_CODES.indexOf(end);
    if (first < 0 || last < 0) return null;
    for (let i = first; ; i = (i + 1) % 7) {
      days.push(WEEKDAYS[i]);
      if (i === last) break;
    }
  }
  return days;
}

/**
 * Reads simple OpenStreetMap hours like "Mo-Fr 11:00-22:00; Sa,Su 12:00-23:00; Mo off".
 * Returns null for anything more complex, so we never show wrong hours.
 */
export function parseOpeningHours(raw: string): FullHours | null {
  const text = raw.trim();
  if (!text) return null;
  if (text === "24/7") {
    return Object.fromEntries(
      WEEKDAYS.map((day) => [day, { open: "00:00", close: "00:00" }]),
    ) as FullHours;
  }

  const hours: Partial<FullHours> = {};
  for (const rule of text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)) {
    const match = rule.match(/^([A-Za-z, -]+?)\s+(off|closed|\d{2}:\d{2}-\d{2}:\d{2})$/);
    if (!match) return null;
    const days = expandDays(match[1]);
    if (!days) return null;
    let value: { open: string; close: string } | null = null;
    if (!/^(off|closed)$/.test(match[2])) {
      const [open, rawClose] = match[2].split("-");
      const close = rawClose === "24:00" ? "00:00" : rawClose;
      if (!TIME.test(open) || !TIME.test(close)) return null;
      value = { open, close };
    }
    for (const day of days) hours[day] = value;
  }
  return Object.fromEntries(WEEKDAYS.map((day) => [day, hours[day] ?? null])) as FullHours;
}
