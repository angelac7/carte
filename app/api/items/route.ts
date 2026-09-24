import { NextResponse } from "next/server";
import { z } from "zod";
import { readItems, writeItems } from "@/lib/db";
import { ExtractedDishSchema, MenuItemSchema, type MenuItem } from "@/types/menu";

const SaveRequest = z.object({ items: z.array(ExtractedDishSchema).max(300) });
const DeleteRequest = z.object({ id: z.string().min(1) });

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Every saved dish. */
export async function GET() {
  return NextResponse.json(readItems());
}

/** Saves dishes from a menu scan. New dishes always start unconfirmed. */
export async function POST(req: Request) {
  const parsed = SaveRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("The dishes to save were not in the expected format.");

  const added: MenuItem[] = parsed.data.items.map((dish) => ({
    id: crypto.randomUUID(),
    name: dish.name,
    description: dish.description,
    price: dish.price,
    allergens: dish.likely_allergens,
    dietary_tags: dish.dietary_tags,
    notes: "",
    confirmed: false,
  }));
  writeItems([...readItems(), ...added]);
  return NextResponse.json(added);
}

/** Updates one dish. */
export async function PUT(req: Request) {
  const parsed = MenuItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("That dish was not in the expected format.");

  const items = readItems();
  if (!items.some((item) => item.id === parsed.data.id))
    return fail("That dish no longer exists.", 404);
  writeItems(items.map((item) => (item.id === parsed.data.id ? parsed.data : item)));
  return NextResponse.json(parsed.data);
}

/** Deletes one dish. */
export async function DELETE(req: Request) {
  const parsed = DeleteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("No dish was specified.");

  writeItems(readItems().filter((item) => item.id !== parsed.data.id));
  return NextResponse.json({ ok: true });
}
