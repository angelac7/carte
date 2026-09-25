import { z } from "zod";
import { NextResponse } from "next/server";
import { translateDishes } from "@/lib/ai/translate";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { getCachedTranslations, saveTranslations } from "@/lib/db/translations";
import { isLanguageCode, languageName } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Translations for a restaurant's confirmed dishes, made once per language and then reused. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const slug = params.get("restaurant") ?? "";
  const language = params.get("lang") ?? "";
  const input = z
    .object({
      slug: z.string().refine(isValidSlug),
      language: z.custom<import("@/lib/languages").LanguageCode>(
        (value) => typeof value === "string" && isLanguageCode(value),
      ),
    })
    .safeParse({ slug, language });
  if (!input.success || !isLanguageCode(language)) {
    return NextResponse.json({ error: "Choose a supported language." }, { status: 400 });
  }
  if (!(await checkRateLimit(`translate:${clientKey(req)}`, 60, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests. Try again soon." }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, slug);
    if (!restaurant) return NextResponse.json({ error: "Menu not found." }, { status: 404 });

    const dishes = await getConfirmedDishes(supabase, restaurant.id);
    const { found, missing } = await getCachedTranslations(language, dishes);
    if (missing.length > 0) {
      const fresh = await translateDishes(missing, languageName(language));
      await saveTranslations(language, missing, fresh);
      for (const { id, name, description, notes, section, options } of fresh)
        found[id] = { name, description, notes, section, options };
    }
    return NextResponse.json({ translations: found });
  } catch (err) {
    console.error("Menu translation failed:", err);
    return NextResponse.json({ error: "Translation isn't available right now." }, { status: 502 });
  }
}
