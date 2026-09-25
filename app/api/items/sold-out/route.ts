import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { restaurantClock } from "@/lib/availability";
import { setSoldOut } from "@/lib/db";

const SoldOutRequest = z.object({ id: z.uuid(), soldOut: z.boolean() });

/** Marks a dish sold out for today's service, or available again. Doesn't affect confirmation. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return NextResponse.json({ error: "Log in to manage your menu." }, { status: 401 });
  const parsed = SoldOutRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "No dish was specified." }, { status: 400 });

  const clock = restaurantClock(owner.restaurant.timezone ?? "America/New_York");
  const serviceDay = parsed.data.soldOut ? (clock?.date ?? null) : null;
  const dish = await setSoldOut(owner.supabase, owner.restaurant.id, parsed.data.id, serviceDay);
  if (!dish) return NextResponse.json({ error: "That dish wasn't found." }, { status: 404 });
  return NextResponse.json(dish);
}
