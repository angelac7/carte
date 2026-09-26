import type { Metadata } from "next";
import { findRestaurant, MenuPage } from "@/components/MenuPage";

export const dynamic = "force-dynamic";

type EmbeddedMenuProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
};

/** Search engines should find the menu at its own address, so they skip this framed copy. */
export async function generateMetadata({ params }: EmbeddedMenuProps): Promise<Metadata> {
  const restaurant = await findRestaurant((await params).slug);
  return {
    title: restaurant ? `${restaurant.name} | Carte` : "Menu | Carte",
    robots: { index: false },
    ...(restaurant ? { alternates: { canonical: `/r/${restaurant.slug}` } } : {}),
  };
}

/** The diner menu for restaurants' own websites, shown in a frame with a compact header. */
export default async function EmbeddedMenuPage({ params, searchParams }: EmbeddedMenuProps) {
  return <MenuPage slug={(await params).slug} table={(await searchParams).table} embedded />;
}
