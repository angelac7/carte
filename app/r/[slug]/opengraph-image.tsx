import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { SHARE_IMAGE_SIZE, shareImage } from "@/lib/share-image";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const alt = "A restaurant's menu on Carte";
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

/** The preview shown when someone shares a restaurant's menu link. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const restaurant = isValidSlug(slug) ? await getRestaurantBySlug(supabase, slug) : null;
  if (!restaurant) return shareImage({ title: "Menu", subtitle: "" });
  const dishes = await getConfirmedDishes(supabase, restaurant.id).catch(() => []);
  return shareImage({
    title: restaurant.name,
    subtitle: [restaurant.cuisine, restaurant.city].filter(Boolean).join(" · "),
    photo: restaurant.cover_url || (dishes.find((dish) => dish.photo_url)?.photo_url ?? null),
  });
}
