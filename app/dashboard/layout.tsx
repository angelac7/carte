import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { requireUser } from "@/lib/auth";
import { getOwnerRestaurant } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const restaurant = await getOwnerRestaurant(supabase, user.id);
  return (
    <>
      <OwnerHeader restaurant={restaurant} />
      {children}
    </>
  );
}
