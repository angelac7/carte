import type { Metadata } from "next";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProfileForm } from "@/components/owner/ProfileForm";
import { requireRestaurant } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/db/profile";

export const metadata: Metadata = { title: "Restaurant profile | Carte" };

export default async function ProfilePage() {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/profile");
  const profile = await getRestaurantProfile(supabase, restaurant.id);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12">
      <OwnerPageHeader
        title="Restaurant profile"
        intro="This appears on Carte Discover, where diners search for restaurants and dishes. It’s only shown once you turn on listing."
      />
      <ProfileForm profile={profile} />
    </main>
  );
}
