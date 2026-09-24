"use server";
import { redirect } from "next/navigation";
import { requireRestaurant } from "@/lib/auth";
import { claimPlace } from "@/lib/db/places";
import { isValidPlaceId } from "@/lib/places/normalize";
import { getPlace } from "@/lib/places/osm";

export async function claimPlaceAction(formData: FormData) {
  const { supabase, restaurant } = await requireRestaurant();
  const placeId = String(formData.get("place") ?? "");
  if (!isValidPlaceId(placeId)) redirect("/dashboard/claim?error=missing");

  const place = await getPlace(placeId).catch(() => null);
  if (!place) redirect(`/dashboard/claim?place=${placeId}&error=missing`);

  const result = await claimPlace(supabase, restaurant.id, place);
  if (!result.ok) redirect(`/dashboard/claim?place=${placeId}&error=${result.reason}`);
  redirect("/dashboard/claim?claimed=1");
}
