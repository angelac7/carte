import { groupBySection } from "@/lib/menu-sections";
import { parsePrice } from "@/lib/prices";
import { WEEKDAYS, type FullHours, type Weekday } from "@/lib/restaurant-profile";
import type { MenuItem } from "@/types/menu";

const DAY_NAMES: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** Search engines only need a menu's highlights; very long menus are cut here. */
const MAX_DISHES = 300;

export type StructuredMenu = {
  name: string;
  url: string;
  image?: string | null;
  description?: string;
  cuisine?: string;
  phone?: string;
  address?: string;
  city?: string | null;
  priceRange?: number;
  reservationUrl?: string;
  /** Accessibility and family facts, named in English for search engines. */
  features?: string[];
  /** Only hours the owner actually saved; never defaults. */
  hours?: FullHours | null;
  /** The menu's currency, like "USD", so prices can be included. */
  currency?: string;
  dishes: (Pick<MenuItem, "name" | "description" | "section" | "calories"> & { price?: string })[];
};

/**
 * What Google and other search engines read about a menu: the restaurant, its hours, and its
 * dishes. Allergens and diet labels are left out on purpose, so they're only ever shown on Carte
 * with its warnings.
 */
export function menuStructuredData(menu: StructuredMenu) {
  const hours = WEEKDAYS.flatMap((day) => {
    const time = menu.hours?.[day];
    return time
      ? [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
            opens: time.open,
            // A closing time before the opening time means past midnight, as Google expects.
            closes: time.close,
          },
        ]
      : [];
  });
  const address = menu.address?.trim();
  const city = menu.city?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: menu.name,
    url: menu.url,
    ...(menu.image ? { image: menu.image } : {}),
    ...(menu.description?.trim() ? { description: menu.description.trim() } : {}),
    ...(menu.cuisine?.trim() ? { servesCuisine: menu.cuisine.trim() } : {}),
    ...(menu.phone?.trim() ? { telephone: menu.phone.trim() } : {}),
    ...(address || city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(address ? { streetAddress: address } : {}),
            ...(city ? { addressLocality: city } : {}),
          },
        }
      : {}),
    ...(menu.priceRange ? { priceRange: "$".repeat(menu.priceRange) } : {}),
    ...(menu.reservationUrl?.trim() ? { acceptsReservations: menu.reservationUrl.trim() } : {}),
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(menu.features?.length
      ? {
          amenityFeature: menu.features.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
        }
      : {}),
    hasMenu: {
      "@type": "Menu",
      url: menu.url,
      hasMenuSection: groupBySection(menu.dishes.slice(0, MAX_DISHES)).map((group) => ({
        "@type": "MenuSection",
        name: group.section || "Menu",
        hasMenuItem: group.dishes.map((dish) => ({
          "@type": "MenuItem",
          name: dish.name,
          ...(dish.description?.trim() ? { description: dish.description.trim() } : {}),
          ...offer(dish.price, menu.currency),
          ...(dish.calories != null
            ? {
                nutrition: {
                  "@type": "NutritionInformation",
                  calories: `${dish.calories} calories`,
                },
              }
            : {}),
        })),
      })),
    },
  };
}

/** A dish's price for search engines, when it's one clear amount in a known currency. */
function offer(price: string | undefined, currency: string | undefined) {
  const amount = price ? parsePrice(price) : null;
  return amount !== null && currency
    ? { offers: { "@type": "Offer", price: amount.toFixed(2), priceCurrency: currency } }
    : {};
}

/** Structured data as script text, with "<" escaped so no value can end the script early. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
