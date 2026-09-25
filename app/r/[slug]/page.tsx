import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveDinerMenu } from "@/components/LiveDinerMenu";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { getCachedSummaries } from "@/lib/db/insights";
import { getPopularDishIds } from "@/lib/db/popular";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { DISPLAY_COOKIE, parseDisplay } from "@/lib/display-prefs";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";
import { isValidSlug } from "@/lib/slug";
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

export async function generateMetadata({ params }: RestaurantMenuProps): Promise<Metadata> {
  const restaurant = await findRestaurant((await params).slug);
  if (!restaurant) return { title: "Menu | Carte" };
  const place = [restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ");
  const description = `${place ? `${place}. ` : ""}See the menu with allergen and diet filters, in 7 languages.`;
  return {
    title: `${restaurant.name} | Carte`,
    description,
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
  const [initialSummaries, popularIds] = await Promise.all([
    getCachedSummaries(dishes, initialLanguage).catch(() => ({})),
    getPopularDishIds(supabase, restaurant.id).catch(() => [] as string[]),
  ]);

  return (
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
      }}
      dishes={dishes}
      initialNow={renderedAt.getTime()}
      initialLanguage={initialLanguage}
      initialPrefs={initialPrefs}
      initialDisplay={initialDisplay}
      initialSummaries={initialSummaries}
      popularIds={popularIds}
      initialTableCode={tableCode}
    />
  );
}
