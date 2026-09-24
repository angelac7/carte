import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { getDishPhoto, setDishPhoto } from "@/lib/db/photos";
import { checkRateLimit } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import { deleteStoredPhoto, storeDishPhoto } from "@/lib/storage/dish-photos";

const DishId = z.uuid();

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Adds or replaces the photo for one of the owner's dishes. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail("Log in to manage your menu.", 401);
  if (!(await checkRateLimit(`photo-upload:${owner.user.id}`, 60, 60 * 60 * 1000))) {
    return fail("Too many uploads in the last hour. Try again later.", 429);
  }

  const form = await req.formData().catch(() => null);
  const dishId = String(form?.get("dish") ?? "");
  if (!DishId.safeParse(dishId).success) return fail("No dish was specified.", 400);
  const image = await readImageUpload(form?.get("image"));
  if (!image.ok) return fail(image.message, image.status);

  const current = await getDishPhoto(owner.supabase, owner.restaurant.id, dishId);
  if (!current.exists) return fail("That dish no longer exists.", 404);

  try {
    const photoUrl = await storeDishPhoto(
      owner.restaurant.id,
      dishId,
      Buffer.from(image.base64, "base64"),
      image.mediaType,
    );
    await setDishPhoto(owner.supabase, owner.restaurant.id, dishId, photoUrl);
    await deleteStoredPhoto(current.photoUrl, owner.restaurant.id).catch(() => {});
    return NextResponse.json({ photoUrl });
  } catch (err) {
    console.error("Dish photo upload failed:", err);
    return fail("The photo couldn't be saved. Try again.", 502);
  }
}

/** Removes a dish's photo. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail("Log in to manage your menu.", 401);
  const body = (await req.json().catch(() => null)) as { dish?: unknown } | null;
  const parsed = DishId.safeParse(body?.dish);
  if (!parsed.success) return fail("No dish was specified.", 400);

  const current = await getDishPhoto(owner.supabase, owner.restaurant.id, parsed.data);
  if (!current.exists) return fail("That dish no longer exists.", 404);
  await setDishPhoto(owner.supabase, owner.restaurant.id, parsed.data, null);
  await deleteStoredPhoto(current.photoUrl, owner.restaurant.id).catch(() => {});
  return NextResponse.json({ ok: true });
}
