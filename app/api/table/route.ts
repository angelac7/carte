import { NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantBySlug } from "@/lib/db";
import { createSharedOrder, getSharedOrder, setSharedLine } from "@/lib/db/shared-orders";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

// Shared table orders hold dishes and quantities only, never anything about the diners.
const Code = z.string().regex(/^[a-z2-9]{10}$/);
const Slug = z.string().refine(isValidSlug);
const LineKey = z.string().regex(/^[0-9a-f-]{36}(\|[0-9]*\|[0-9.]*)?$/);
const Lines = z
  .record(LineKey, z.number().int().min(1).max(20))
  .refine((lines) => Object.keys(lines).length <= 60);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function restaurantFor(slug: string) {
  return getRestaurantBySlug(await createClient(), slug);
}

/** Starts a shared order for a table, from the order on this phone. */
export async function POST(req: Request) {
  const parsed = z
    .object({ restaurant: Slug, order: Lines })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid order.", 400);
  if (!(await checkRateLimit(`table-create:${clientKey(req)}`, 10, 60 * 60 * 1000))) {
    return fail("Too many shared orders. Try again later.", 429);
  }
  const restaurant = await restaurantFor(parsed.data.restaurant);
  if (!restaurant) return fail("Menu not found.", 404);
  return NextResponse.json(await createSharedOrder(restaurant.id, parsed.data.order));
}

/** The table's current order, checked every few seconds while the menu is open. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const code = Code.safeParse(params.get("code"));
  const slug = Slug.safeParse(params.get("restaurant"));
  if (!code.success || !slug.success) return fail("Invalid order.", 400);
  if (!(await checkRateLimit(`table-read:${clientKey(req)}`, 600, 10 * 60 * 1000))) {
    return fail("Too many requests.", 429);
  }
  const [order, restaurant] = await Promise.all([
    getSharedOrder(code.data),
    restaurantFor(slug.data),
  ]);
  if (!order || !restaurant || order.restaurantId !== restaurant.id) {
    return fail("This shared order has ended.", 404);
  }
  return NextResponse.json({ lines: order.lines }, { headers: { "Cache-Control": "no-store" } });
}

/** Sets how many of one line the table wants. */
export async function PUT(req: Request) {
  const parsed = z
    .object({ code: Code, line: LineKey, quantity: z.number().int().min(0).max(20) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid change.", 400);
  if (!(await checkRateLimit(`table-change:${clientKey(req)}`, 300, 10 * 60 * 1000))) {
    return fail("Too many changes. Slow down a little.", 429);
  }
  try {
    const lines = await setSharedLine(parsed.data.code, parsed.data.line, parsed.data.quantity);
    if (!lines) return fail("This shared order has ended.", 404);
    return NextResponse.json({ lines });
  } catch {
    return fail("That dish can't be added to this order.", 400);
  }
}
