import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { DinerMenu } from "@/components/DinerMenu";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
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

  const saved = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const initialLanguage =
    saved && isLanguageCode(saved) ? saved : languageFromAcceptHeader(acceptLanguage);

  return (
    <DinerMenu
      restaurant={{ name: restaurant.name, slug: restaurant.slug }}
      dishes={dishes}
      initialLanguage={initialLanguage}
    />
  );
}
