import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { getCachedSummaries } from "@/lib/db/insights";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

const Query = z.object({
  restaurant: z.string().refine(isValidSlug),
  lang: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
});

/** One-line explanations already written for a menu in a language. Never calls AI. */
export async function GET(req: Request) {
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await checkRateLimit(`summaries:${clientKey(req)}`, 60, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests. Try again soon." }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, parsed.data.restaurant);
    if (!restaurant) return NextResponse.json({ error: "Menu not found." }, { status: 404 });
    const dishes = await getConfirmedDishes(supabase, restaurant.id);
    return NextResponse.json({ summaries: await getCachedSummaries(dishes, parsed.data.lang) });
  } catch (err) {
    reportError("Loading dish summaries failed", err);
    return NextResponse.json({ error: "Summaries aren't available." }, { status: 502 });
  }
}
