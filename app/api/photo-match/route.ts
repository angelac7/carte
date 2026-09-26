import { NextResponse } from "next/server";
import { matchDishPhoto } from "@/lib/ai/photo-match";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { languageName } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import { filterDishes } from "@/lib/menu-filters";
import { PhotoMatchRequestSchema } from "@/types/camera";
import { createClient } from "@/lib/supabase/server";
import { reportError } from "@/lib/report-error";

/** Finds which of a restaurant's confirmed dishes a photo shows. */
export async function POST(req: Request) {
  if (!(await checkRateLimit(`photo:${clientKey(req)}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const parsed = PhotoMatchRequestSchema.safeParse({
    restaurant: form?.get("restaurant"),
    language: form?.get("lang"),
    avoid: form?.getAll("avoid") ?? [],
    onlyTags: form?.getAll("onlyTags") ?? [],
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { restaurant: slug, language } = parsed.data;
  const image = await readImageUpload(form?.get("image"));
  if (!image.ok) return NextResponse.json({ error: image.message }, { status: image.status });

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, slug);
    if (!restaurant) return NextResponse.json({ error: "not found" }, { status: 404 });
    const dishes = filterDishes(await getConfirmedDishes(supabase, restaurant.id), parsed.data);
    if (dishes.length === 0) return NextResponse.json({ matches: [] });

    const matches = await matchDishPhoto(
      image.base64,
      image.mediaType,
      dishes,
      languageName(language),
      restaurant.name,
    );
    return NextResponse.json({ matches });
  } catch (err) {
    reportError("Photo match failed", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
