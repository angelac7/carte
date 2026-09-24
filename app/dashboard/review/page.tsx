import type { Metadata } from "next";
import ReviewDishes from "@/components/owner/ReviewDishes";
import { requireRestaurant } from "@/lib/auth";

export const metadata: Metadata = { title: "Review dishes | Carte" };

export default async function ReviewPage() {
  await requireRestaurant();
  return <ReviewDishes />;
}
