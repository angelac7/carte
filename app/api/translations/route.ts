import { NextResponse } from "next/server";
import { translateDishes } from "@/lib/ai/translate";
import { readItems } from "@/lib/db";
import { getCachedTranslations, saveTranslations } from "@/lib/db/translations";
import { isLanguageCode, languageName, ORIGINAL_LANGUAGE } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";

export const dynamic = "force-dynamic";

/** Translations for confirmed dishes. Each dish is translated once per language, then reused. */
export async function GET(req: Request) {
  const language = new URL(req.url).searchParams.get("lang") ?? "";
  if (!isLanguageCode(language) || language === ORIGINAL_LANGUAGE) {
    return NextResponse.json({ error: "Choose a supported language." }, { status: 400 });
  }

  const dishes = confirmedOnly(readItems());
  const { found, missing } = getCachedTranslations(language, dishes);

  if (missing.length > 0) {
    try {
      const fresh = await translateDishes(missing, languageName(language));
      saveTranslations(language, missing, fresh);
      for (const { id, name, description, notes } of fresh)
        found[id] = { name, description, notes };
    } catch (err) {
      console.error("Menu translation failed:", err);
      return NextResponse.json(
        { error: "Translation isn't available right now." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ translations: found });
}
