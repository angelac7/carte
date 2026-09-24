import { NextResponse } from "next/server";
import { z } from "zod";
import { explainDish } from "@/lib/ai/explain";
import { getConfirmedDish, getRestaurantBySlug } from "@/lib/db";
import { getCachedInsight, saveInsight } from "@/lib/db/insights";
import { isLanguageCode, languageName, type LanguageCode } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Query = z.object({
  restaurant: z.string().refine(isValidSlug),
  dish: z.uuid(),
  lang: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
});

/** Explains one confirmed dish in the diner's language, generated once and then reused. */
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Query.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!checkRateLimit(`insight:${clientKey(req)}`, 60, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again soon." }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, parsed.data.restaurant);
    if (!restaurant) return NextResponse.json({ error: "Menu not found." }, { status: 404 });

    const dish = await getConfirmedDish(supabase, restaurant.id, parsed.data.dish);
    if (!dish) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

    const language = parsed.data.lang;
    const cached = await getCachedInsight(dish, language);
    if (cached) return NextResponse.json({ insight: cached });

    const insight = await explainDish(dish, languageName(language), restaurant.name);
    await saveInsight(dish, language, insight);
    return NextResponse.json({ insight });
  } catch (err) {
    console.error("Dish explanation failed:", err);
    return NextResponse.json({ error: "Dish details aren't available." }, { status: 502 });
  }
}
