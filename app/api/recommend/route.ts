import { NextResponse } from "next/server";
import { recommendDishes } from "@/lib/ai/recommend";
import { dishAvailability, restaurantClock } from "@/lib/availability";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { languageName } from "@/lib/languages";
import { filterDishes } from "@/lib/menu-filters";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { RecommendRequestSchema } from "@/types/recommend";

/** Suggests dishes from a restaurant's confirmed menu, after applying the diner's filters. */
export async function POST(req: Request) {
  if (!(await checkRateLimit(`recommend:${clientKey(req)}`, 20, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }
  const parsed = RecommendRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, parsed.data.restaurant);
    if (!restaurant) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Filter first, so the AI never sees dishes the diner has ruled out or can't order now.
    const { avoid, onlyTags, language } = parsed.data;
    const clock = restaurantClock(restaurant.timezone ?? "America/New_York");
    const dishes = filterDishes(await getConfirmedDishes(supabase, restaurant.id), {
      avoid,
      onlyTags,
    }).filter((dish) => dishAvailability(dish, clock) === "available");
    if (dishes.length === 0) {
      return NextResponse.json({ recommendation: { picks: [], note: "" } });
    }

    const recommendation = await recommendDishes(
      dishes,
      parsed.data,
      languageName(language),
      restaurant.name,
    );
    return NextResponse.json({ recommendation });
  } catch (err) {
    console.error("Recommendation failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
