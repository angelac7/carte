import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { addDishes, deleteAllDishes, deleteDish, listDishes, updateDish } from "@/lib/db";
import { getDishPhoto } from "@/lib/db/photos";
import { withoutDuplicates } from "@/lib/menu-dedupe";
import { prepareExplanations } from "@/lib/prepare-explanations";
import { deleteStoredPhoto } from "@/lib/storage/dish-photos";
import { tagConflictMessages } from "@/lib/tag-conflicts";
import { ExtractedDishSchema, MenuItemSchema } from "@/types/menu";

const SaveRequest = z.object({
  items: z.array(ExtractedDishSchema).max(300),
  // Menu uploads skip dishes already on the menu; dishes added by hand never do.
  skipExisting: z.boolean().optional(),
});
const Version = z.number().int().positive();
const DeleteRequest = z.union([
  z.object({ id: z.uuid(), revision: Version }),
  z.object({
    all: z.literal(true),
    expected: z.array(z.object({ id: z.uuid(), revision: Version })).max(10000),
  }),
]);
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

/**
 * Saves dishes from a menu scan or added by hand, and returns the dishes actually added.
 * New dishes always start unconfirmed.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = SaveRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("The dishes to save were not in the expected format.");
  const { items, skipExisting } = parsed.data;
  const toAdd = skipExisting
    ? withoutDuplicates(
        (await listDishes(owner.supabase, owner.restaurant.id)).map((dish) => dish.name),
        items,
      )
    : items;
  return NextResponse.json(await addDishes(owner.supabase, owner.restaurant.id, toAdd));
}

/** Updates one dish's details, allergens, tags, notes, or confirmation. */
export async function PUT(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = MenuItemSchema.extend({ revision: Version }).safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return fail("That dish was not in the expected format.");
  // A contradicted diet tag (like vegan with eggs) would mislead diners, so it can't be confirmed.
  const conflicts = tagConflictMessages(parsed.data.allergens, parsed.data.dietary_tags);
  if (parsed.data.confirmed && conflicts.length > 0) return fail(conflicts.join(" "));
  const updated = await updateDish(owner.supabase, owner.restaurant.id, parsed.data);
  if (!updated)
    return fail(
      "This dish changed in another tab or was deleted. Reload to review the latest version.",
      409,
    );
  // Explain a newly confirmed dish right away, so the first diner to open it doesn't wait.
  if (updated.confirmed) after(() => prepareExplanations([updated], owner.restaurant.name));
  return NextResponse.json(updated);
}

/** Deletes one dish, or every dish, along with their photos. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail(LOGIN_REQUIRED, 401);
  const parsed = DeleteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("No dish was specified.");

  if ("all" in parsed.data) {
    let photos: string[];
    try {
      photos = await deleteAllDishes(owner.supabase, owner.restaurant.id, parsed.data.expected);
    } catch (error) {
      if ((error as { code?: string }).code === "40001")
        return fail("The menu changed. Reload before deleting.", 409);
      throw error;
    }
    await Promise.all(
      photos.map((photo) => deleteStoredPhoto(photo, owner.restaurant.id).catch(() => {})),
    );
    return NextResponse.json({ ok: true });
  }

  const { photoUrl } = await getDishPhoto(owner.supabase, owner.restaurant.id, parsed.data.id);
  if (
    !(await deleteDish(owner.supabase, owner.restaurant.id, parsed.data.id, parsed.data.revision))
  )
    return fail("This dish changed. Reload before deleting.", 409);
  await deleteStoredPhoto(photoUrl, owner.restaurant.id).catch(() => {});
  return NextResponse.json({ ok: true });
}
