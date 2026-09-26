import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProfileForm } from "@/components/owner/ProfileForm";
import { RestaurantImages } from "@/components/owner/RestaurantImages";
import { requireRestaurant } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/db/profile";
import { getRestaurantImages } from "@/lib/db/restaurant-images";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.profile.title);

export default async function ProfilePage() {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/profile");
  const { t } = await ownerStrings();
  const [profile, images] = await Promise.all([
    getRestaurantProfile(supabase, restaurant.id),
    getRestaurantImages(supabase, restaurant.id),
  ]);

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12">
      <OwnerPageHeader title={t.profile.title} intro={t.profile.intro} />
      <RestaurantImages initial={images} />
      <ProfileForm profile={profile} />
    </main>
  );
}
