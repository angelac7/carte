import type { Metadata } from "next";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProfileForm } from "@/components/owner/ProfileForm";
import { RestaurantImages } from "@/components/owner/RestaurantImages";
import { requireRestaurant } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/db/profile";
import { getRestaurantImages } from "@/lib/db/restaurant-images";

export const metadata: Metadata = { title: "Restaurant profile | Carte" };

export default async function ProfilePage() {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/profile");
  const [profile, images] = await Promise.all([
    getRestaurantProfile(supabase, restaurant.id),
    getRestaurantImages(supabase, restaurant.id),
  ]);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12">
      <OwnerPageHeader
        title="Restaurant profile"
        intro="This appears on Carte Discover, where diners search for restaurants and dishes. It’s only shown once you turn on listing."
      />
      <RestaurantImages initial={images} />
      <ProfileForm profile={profile} />
    </main>
  );
}
