import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { restaurantClock } from "@/lib/availability";
import { setSoldOut } from "@/lib/db";
import { ownerStrings } from "@/lib/owner-language";

const SoldOutRequest = z.object({ id: z.uuid(), soldOut: z.boolean() });

/** Marks a dish sold out for today's service, or available again. Doesn't affect confirmation. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return NextResponse.json({ error: t.api.loginMenu }, { status: 401 });
  const parsed = SoldOutRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t.api.noDish }, { status: 400 });

  const clock = restaurantClock(owner.restaurant.timezone ?? "America/New_York");
  const serviceDay = parsed.data.soldOut ? (clock?.date ?? null) : null;
  const dish = await setSoldOut(owner.supabase, owner.restaurant.id, parsed.data.id, serviceDay);
  if (!dish) return NextResponse.json({ error: t.api.dishNotFound }, { status: 404 });
  return NextResponse.json(dish);
}
