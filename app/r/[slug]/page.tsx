import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveDinerMenu } from "@/components/LiveDinerMenu";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { getCachedSummaries } from "@/lib/db/insights";
import { getPublicDetails } from "@/lib/db/profile";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getPopularDishIds } from "@/lib/db/popular";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISPLAY_COOKIE, parseDisplay } from "@/lib/display-prefs";
import {
  isLanguageCode,
  LANGUAGE_COOKIE,
  LANGUAGES,
  languageFromAcceptHeader,
} from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";
import { guessCurrency, isConvertible } from "@/lib/prices";
import { siteUrl } from "@/lib/site-url";
import { isValidSlug } from "@/lib/slug";
import { jsonLdText, menuStructuredData } from "@/lib/structured-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RestaurantMenuProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
};

/** Looked up once per visit, for both the tab title and the page. */
const findRestaurant = cache(async (slug: string) =>
  isValidSlug(slug) ? getRestaurantBySlug(await createClient(), slug) : null,
);

/** Whether the owner shows this menu on Discover and Google, with the details search engines get. */
const findPublicDetails = cache(async (restaurantId: string) =>
  getPublicDetails(await createClient(), restaurantId).catch(() => null),
);

export async function generateMetadata({ params }: RestaurantMenuProps): Promise<Metadata> {
  const restaurant = await findRestaurant((await params).slug);
  if (!restaurant) return { title: "Menu | Carte" };
  const details = await findPublicDetails(restaurant.id);
  const place = [restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ");
  const description = `${place ? `${place}. ` : ""}See the menu with allergen and diet filters, in ${LANGUAGES.length} languages.`;
  return {
    title: `${restaurant.name} | Carte`,
    description,
    // Menus left off Discover are for people with the link, so search engines skip them too.
    ...(details?.listed ? {} : { robots: { index: false } }),
    openGraph: {
      siteName: "Carte",
      type: "website",
      title: `${restaurant.name} menu`,
      description,
      url: `/r/${restaurant.slug}`,
    },
  };
}

export default async function RestaurantMenuPage({ params, searchParams }: RestaurantMenuProps) {
  const { slug } = await params;
  // A shared table order, opened from a friend's link.
  const table = (await searchParams).table;
  const tableCode = table && /^[a-z2-9]{10}$/.test(table) ? table : null;
  const restaurant = await findRestaurant(slug);
  if (!restaurant) notFound();

  const supabase = await createClient();

  // Filtered to confirmed dishes in the database, then again here as a safety net.
  const dishes = confirmedOnly(await getConfirmedDishes(supabase, restaurant.id));

  // The diner's saved language and filters, stored on their own device.
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const initialLanguage =
    savedLanguage && isLanguageCode(savedLanguage)
      ? savedLanguage
      : languageFromAcceptHeader(acceptLanguage);
  const initialPrefs = parsePrefs(cookieStore.get(PREFS_COOKIE)?.value);
  const initialDisplay = parseDisplay(cookieStore.get(DISPLAY_COOKIE)?.value);
  // This page renders once per visit; the browser keeps the clock current from here.
  const renderedAt = new Date();
  // Short explanations already written in the diner's language, shown under each dish name.
  const [initialSummaries, popularIds, details, exchangeRates] = await Promise.all([
    getCachedSummaries(dishes, initialLanguage).catch(() => ({})),
    getPopularDishIds(supabase, restaurant.id).catch(() => [] as string[]),
    findPublicDetails(restaurant.id),
    getExchangeRates(),
  ]);
  // The owner's choice, or worked out from the price symbols and time zone.
  const menuCurrency =
    restaurant.currency ||
    guessCurrency(
      dishes.map((dish) => dish.price),
      restaurant.timezone,
    );
  const structuredData = details?.listed
    ? menuStructuredData({
        name: restaurant.name,
        url: `${siteUrl()}/r/${restaurant.slug}`,
        image: restaurant.cover_url ?? restaurant.logo_url,
        description: details.description,
        cuisine: restaurant.cuisine,
        phone: restaurant.phone,
        address: details.address,
        city: restaurant.city,
        priceRange: restaurant.price_range,
        reservationUrl: restaurant.reservation_url,
        hours: details.hours,
        currency: menuCurrency,
        features: (restaurant.features ?? []).map((feature) => DINER_STRINGS.en.features[feature]),
        dishes,
      })
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdText(structuredData) }}
        />
      )}
      <LiveDinerMenu
        key={slug}
        restaurant={{
          name: restaurant.name,
          slug: restaurant.slug,
          cuisine: restaurant.cuisine,
          city: restaurant.city ?? "",
          timezone: restaurant.timezone,
          phone: restaurant.phone,
          website: restaurant.website,
          reservation_url: restaurant.reservation_url,
          price_range: restaurant.price_range,
          logo_url: restaurant.logo_url,
          cover_url: restaurant.cover_url,
          kitchen_practices: restaurant.kitchen_practices ?? [],
          features: restaurant.features ?? [],
        }}
        dishes={dishes}
        initialNow={renderedAt.getTime()}
        initialLanguage={initialLanguage}
        initialPrefs={initialPrefs}
        initialDisplay={initialDisplay}
        initialSummaries={initialSummaries}
        popularIds={popularIds}
        initialTableCode={tableCode}
        menuCurrency={menuCurrency}
        exchangeRates={isConvertible(menuCurrency) ? exchangeRates : null}
      />
    </>
  );
}
