import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveDinerMenu } from "@/components/LiveDinerMenu";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { DISPLAY_COOKIE, parseDisplay } from "@/lib/display-prefs";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RestaurantMenuProps = { params: Promise<{ slug: string }> };

/** Looked up once per visit, for both the tab title and the page. */
const findRestaurant = cache(async (slug: string) =>
  isValidSlug(slug) ? getRestaurantBySlug(await createClient(), slug) : null,
);

export async function generateMetadata({ params }: RestaurantMenuProps): Promise<Metadata> {
  const restaurant = await findRestaurant((await params).slug);
  return { title: restaurant ? `${restaurant.name} | Carte` : "Menu | Carte" };
}

export default async function RestaurantMenuPage({ params }: RestaurantMenuProps) {
  const { slug } = await params;
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

  return (
    <LiveDinerMenu
      key={slug}
      restaurant={{
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: restaurant.cuisine,
        city: restaurant.city ?? "",
      }}
      dishes={dishes}
      initialLanguage={initialLanguage}
      initialPrefs={initialPrefs}
      initialDisplay={initialDisplay}
    />
  );
}
