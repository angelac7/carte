import { NextResponse } from "next/server";
import { getConfirmedDish, getRestaurantBySlug } from "@/lib/db";
import { addDishReport } from "@/lib/db/reports";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { ReportRequestSchema } from "@/types/report";

/** A diner tells the restaurant a dish's details look wrong. Nothing about the diner is kept. */
export async function POST(req: Request) {
  const parsed = ReportRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isValidSlug(parsed.data.restaurant)) {
    return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  }
  if (!(await checkRateLimit(`report:${clientKey(req)}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, parsed.data.restaurant);
    if (!restaurant) return NextResponse.json({ error: "Menu not found." }, { status: 404 });
    const dish = await getConfirmedDish(supabase, restaurant.id, parsed.data.dish);
    if (!dish) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

    await addDishReport(supabase, {
      restaurantId: restaurant.id,
      dishId: dish.id,
      dishName: dish.name,
      kind: parsed.data.kind,
      message: parsed.data.message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Saving a dish report failed:", err);
    return NextResponse.json({ error: "The report couldn't be sent." }, { status: 502 });
  }
}
