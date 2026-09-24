import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const slug = z
    .string()
    .refine(isValidSlug)
    .safeParse(new URL(req.url).searchParams.get("restaurant"));
  if (!slug.success) return NextResponse.json({ error: "Invalid menu" }, { status: 400 });
  if (!(await checkRateLimit(`menu-refresh:${clientKey(req)}`, 240, 60000)))
    return NextResponse.json({ error: "Try again shortly" }, { status: 429 });
  const supabase = await createClient();
  const restaurant = await getRestaurantBySlug(supabase, slug.data);
  if (!restaurant) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  return NextResponse.json(
    { dishes: await getConfirmedDishes(supabase, restaurant.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
