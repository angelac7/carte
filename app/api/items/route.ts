import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { addDishes, deleteAllDishes, deleteDish, listDishes, updateDish } from "@/lib/db";
import { getDishPhoto } from "@/lib/db/photos";
import { deleteStoredPhoto } from "@/lib/storage/dish-photos";
import { ExtractedDishSchema, MenuItemSchema } from "@/types/menu";

const SaveRequest = z.object({ items: z.array(ExtractedDishSchema).max(300) });
const DeleteRequest = z.union([z.object({ id: z.uuid() }), z.object({ all: z.literal(true) })]);
const LOGIN_REQUIRED = "Log in to manage your menu.";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Every dish for the signed-in owner's restaurant. */
export async function GET() {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  return NextResponse.json(await listDishes(owner.supabase, owner.restaurant.id));
}

/** Saves dishes from a menu scan or added by hand. New dishes always start unconfirmed. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = SaveRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("The dishes to save were not in the expected format.");
  return NextResponse.json(await addDishes(owner.supabase, owner.restaurant.id, parsed.data.items));
}

/** Updates one dish's details, allergens, tags, notes, or confirmation. */
export async function PUT(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = MenuItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("That dish was not in the expected format.");
  const updated = await updateDish(owner.supabase, owner.restaurant.id, parsed.data);
  if (!updated) return fail("That dish no longer exists.", 404);
  return NextResponse.json(updated);
}

/** Deletes one dish, or every dish, along with their photos. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = DeleteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("No dish was specified.");

  if ("all" in parsed.data) {
    const photos = await deleteAllDishes(owner.supabase, owner.restaurant.id);
    await Promise.all(
      photos.map((photo) => deleteStoredPhoto(photo, owner.restaurant.id).catch(() => {})),
    );
    return NextResponse.json({ ok: true });
  }

  const { photoUrl } = await getDishPhoto(owner.supabase, owner.restaurant.id, parsed.data.id);
  await deleteDish(owner.supabase, owner.restaurant.id, parsed.data.id);
  await deleteStoredPhoto(photoUrl, owner.restaurant.id).catch(() => {});
  return NextResponse.json({ ok: true });
}
