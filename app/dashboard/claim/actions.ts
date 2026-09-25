"use server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { redirect } from "next/navigation";
import { requireOwnedRestaurant } from "@/lib/auth";
import { claimPlace } from "@/lib/db/places";
import { isValidPlaceId } from "@/lib/places/normalize";
import { getPlace } from "@/lib/places/osm";

export async function claimPlaceAction(formData: FormData) {
  const { supabase, restaurant } = await requireOwnedRestaurant();
  const placeId = String(formData.get("place") ?? "");
  const evidence = z.string().trim().min(20).max(2000).safeParse(formData.get("evidence"));
  if (!evidence.success)
    redirect(`/dashboard/claim?place=${encodeURIComponent(placeId)}&error=evidence`);
  if (!isValidPlaceId(placeId)) redirect("/dashboard/claim?error=missing");

  if (!(await checkRateLimit(`claim:${restaurant.id}`, 30, 10 * 60 * 1000)))
    redirect(`/dashboard/claim?place=${placeId}&error=limited`);
  const place = await getPlace(placeId).catch(() => null);
  if (!place) redirect(`/dashboard/claim?place=${placeId}&error=missing`);

  const result = await claimPlace(supabase, restaurant.id, place, evidence.data);
  if (!result.ok) redirect(`/dashboard/claim?place=${placeId}&error=${result.reason}`);
  redirect("/dashboard/claim?claimed=1");
}
