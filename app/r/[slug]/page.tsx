import type { Metadata } from "next";
import { findPublicDetails, findRestaurant, MenuPage } from "@/components/MenuPage";
import { LANGUAGES } from "@/lib/languages";

export const dynamic = "force-dynamic";

type RestaurantMenuProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
};

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
  return <MenuPage slug={(await params).slug} table={(await searchParams).table} />;
}
