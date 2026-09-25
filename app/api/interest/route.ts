import { NextResponse } from "next/server";
import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/allergens";
import { getRestaurantBySlug } from "@/lib/db";
import { recordDinerInterest } from "@/lib/db/stats";
import { normalizeSearch } from "@/lib/diner-interest";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

const Interest = z.object({
  restaurant: z.string().refine(isValidSlug),
  avoid: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).default([]),
  diets: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length).default([]),
  missed: z.string().max(200).default(""),
});

/** Counts what diners look for at a restaurant. Nothing about the diner is kept. */
export async function POST(req: Request) {
  const parsed = Interest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid." }, { status: 400 });
  if (!(await checkRateLimit(`interest:${clientKey(req)}`, 30, 10 * 60 * 1000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const restaurant = await getRestaurantBySlug(await createClient(), parsed.data.restaurant);
  if (!restaurant) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { avoid, diets, missed } = parsed.data;
  await recordDinerInterest(restaurant.id, {
    avoid: [...new Set(avoid)],
    diets: [...new Set(diets)],
    missed: normalizeSearch(missed),
  }).catch((err) => console.error("Recording diner interest failed:", err));
  return NextResponse.json({ ok: true });
}
