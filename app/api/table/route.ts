import { NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantBySlug } from "@/lib/db";
import { ALLERGENS, OTHER_AVOIDS } from "@/lib/allergens";
import { SEVERITIES } from "@/lib/diner-prefs";
import {
  changeSharedLine,
  createSharedOrder,
  getSharedOrder,
  setSharedAllergies,
  setSharedLine,
} from "@/lib/db/shared-orders";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

// Shared table orders hold dishes and quantities, plus the allergies of anyone who chose to share
// theirs with the table. Nothing else about the diners.
const Code = z.string().regex(/^[a-z2-9]{10}$/);
const Slug = z.string().refine(isValidSlug);
const LineKey = z.string().regex(/^[0-9a-f-]{36}(\|[0-9]*\|[0-9.]*)?$/);
const Person = z.string().regex(/^[a-z2-9]{12}$/);
const AllergyEntry = z.object({
  label: z.string().trim().max(24),
  avoid: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length),
  alsoAvoid: z.array(z.enum(OTHER_AVOIDS)).max(OTHER_AVOIDS.length),
  severity: z.enum(SEVERITIES),
});
const Lines = z
  .record(LineKey, z.number().int().min(1).max(20))
  .refine((lines) => Object.keys(lines).length <= 60);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// What the database says when it turns a change down for good. Anything else, like a dropped
// connection, is worth the phone trying again, so it gets a different answer.
const REJECTED =
  /unknown dish|order too long|invalid change|unknown person|invalid allergies|table full/;
const isRejection = (error: unknown) =>
  REJECTED.test(String((error as { message?: unknown } | null)?.message ?? ""));

function failedChange(label: string, error: unknown, rejection: string) {
  if (isRejection(error)) return fail(rejection, 400);
  reportError(label, error);
  return fail("The table couldn't be updated. Trying again.", 503);
}

const TEN_MINUTES = 10 * 60 * 1000;
// A phone checks the table every 4 seconds, about 150 times in 10 minutes.
const LIMITS = {
  read: { table: 2400, network: 9000 },
  change: { table: 600, network: 3000 },
};

/**
 * Each table gets its own allowance, so a restaurant's diners sharing one Wi-Fi address don't use
 * up each other's. A looser allowance per address still stops anyone trying code after code.
 */
async function withinLimits(kind: keyof typeof LIMITS, code: string, req: Request) {
  const [table, network] = await Promise.all([
    checkRateLimit(`table-${kind}:${code}`, LIMITS[kind].table, TEN_MINUTES),
    checkRateLimit(`table-${kind}-ip:${clientKey(req)}`, LIMITS[kind].network, TEN_MINUTES),
  ]);
  return table && network;
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
  if (!(await withinLimits("read", code.data, req))) return fail("Too many requests.", 429);
  const [order, restaurant] = await Promise.all([
    getSharedOrder(code.data),
    restaurantFor(slug.data),
  ]);
  if (!order || !restaurant || order.restaurantId !== restaurant.id) {
    return fail("This shared order has ended.", 404);
  }
  return NextResponse.json(
    { lines: order.lines, allergies: order.allergies },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// How much one tap changed a line, with a random id so a retry isn't counted twice.
const LineChange = z.object({
  code: Code,
  line: LineKey,
  change: z.number().int().min(-20).max(20),
  id: Person,
});
// Phones that loaded Carte before changes were sent this way set a line's total instead.
const LineTotal = z.object({
  code: Code,
  line: LineKey,
  quantity: z.number().int().min(0).max(20),
});

/** Changes how many of one line the table wants. */
export async function PUT(req: Request) {
  const parsed = z.union([LineChange, LineTotal]).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid change.", 400);
  if (!(await withinLimits("change", parsed.data.code, req))) {
    return fail("Too many changes. Slow down a little.", 429);
  }
  try {
    const { code, line } = parsed.data;
    const lines =
      "change" in parsed.data
        ? await changeSharedLine(code, line, parsed.data.change, parsed.data.id)
        : await setSharedLine(code, line, parsed.data.quantity);
    if (!lines) return fail("This shared order has ended.", 404);
    return NextResponse.json({ lines });
  } catch (error) {
    return failedChange(
      "Changing a shared table's order failed",
      error,
      "That dish can't be added to this order.",
    );
  }
}

/** Shares this person's allergies with the table, or stops sharing them. */
export async function PATCH(req: Request) {
  const parsed = z
    .object({ code: Code, person: Person, entry: AllergyEntry.nullable() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid allergies.", 400);
  if (!(await withinLimits("change", parsed.data.code, req))) {
    return fail("Too many changes. Slow down a little.", 429);
  }
  try {
    const { code, person, entry } = parsed.data;
    const allergies = await setSharedAllergies(code, person, entry);
    if (!allergies) return fail("This shared order has ended.", 404);
    return NextResponse.json({ allergies });
  } catch (error) {
    return failedChange(
      "Sharing allergies with a table failed",
      error,
      "Your allergies couldn't be shared with this table.",
    );
  }
}
