import ReviewDishes from "@/components/owner/ReviewDishes";
import { requireRestaurant } from "@/lib/auth";
import { ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.nav.review);

export default async function ReviewPage() {
  const { restaurant } = await requireRestaurant("/dashboard/review");
  return <ReviewDishes timezone={restaurant.timezone ?? "America/New_York"} />;
}
