import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { DinerMenu } from "@/components/DinerMenu";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { DISPLAY_COOKIE, parseDisplay } from "@/lib/display-prefs";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Menu | Carte" };

type RestaurantMenuProps = { params: Promise<{ slug: string }> };

export default async function RestaurantMenuPage({ params }: RestaurantMenuProps) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const supabase = await createClient();
  const restaurant = await getRestaurantBySlug(supabase, slug);
  if (!restaurant) notFound();

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
    <DinerMenu
      restaurant={{ name: restaurant.name, slug: restaurant.slug, cuisine: restaurant.cuisine }}
      dishes={dishes}
      initialLanguage={initialLanguage}
      initialPrefs={initialPrefs}
      initialDisplay={initialDisplay}
    />
  );
}
