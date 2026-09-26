import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { getDishPhoto, setDishPhoto } from "@/lib/db/photos";
import { checkRateLimit } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import { deleteStoredPhoto, storeDishPhoto } from "@/lib/storage/dish-photos";
import { reportError } from "@/lib/report-error";
import { ownerStrings } from "@/lib/owner-language";

const DishId = z.uuid();
const Version = z.number().int().positive();

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Adds or replaces the photo for one of the owner's dishes. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  if (!(await checkRateLimit(`photo-upload:${owner.user.id}`, 60, 60 * 60 * 1000))) {
    return fail(t.api.tooManyUploads, 429);
  }

  const form = await req.formData().catch(() => null);
  const dishId = String(form?.get("dish") ?? "");
  if (!DishId.safeParse(dishId).success) return fail(t.api.noDish, 400);
  const version = Version.safeParse(Number(form?.get("revision")));
  if (!version.success) return fail(t.api.reloadDish, 400);
  const image = await readImageUpload(form?.get("image"), t.api.image);
  if (!image.ok) return fail(image.message, image.status);

  const current = await getDishPhoto(owner.supabase, owner.restaurant.id, dishId);
  if (!current.exists) return fail(t.api.dishGone, 404);

  try {
    const photoUrl = await storeDishPhoto(
      owner.restaurant.id,
      dishId,
      Buffer.from(image.base64, "base64"),
      image.mediaType,
    );
    let revision: number | null;
    try {
      revision = await setDishPhoto(
        owner.supabase,
        owner.restaurant.id,
        dishId,
        photoUrl,
        version.data,
      );
    } catch (error) {
      await deleteStoredPhoto(photoUrl, owner.restaurant.id).catch(() => {});
      throw error;
    }
    if (!revision) {
      await deleteStoredPhoto(photoUrl, owner.restaurant.id).catch(() => {});
      return fail(t.api.photoConflict, 409);
    }
    await deleteStoredPhoto(current.photoUrl, owner.restaurant.id).catch(() => {});
    return NextResponse.json({ photoUrl, revision });
  } catch (err) {
    reportError("Dish photo upload failed", err);
    return fail(t.api.photoFailed, 502);
  }
}

/** Removes a dish's photo. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  const body = (await req.json().catch(() => null)) as {
    dish?: unknown;
    revision?: unknown;
  } | null;
  const parsed = DishId.safeParse(body?.dish);
  if (!parsed.success) return fail(t.api.noDish, 400);

  const version = Version.safeParse(body?.revision);
  if (!version.success) return fail(t.api.reloadDish, 400);
  const current = await getDishPhoto(owner.supabase, owner.restaurant.id, parsed.data);
  if (!current.exists) return fail(t.api.dishGone, 404);
  const revision = await setDishPhoto(
    owner.supabase,
    owner.restaurant.id,
    parsed.data,
    null,
    version.data,
  );
  if (!revision) return fail(t.api.photoConflict, 409);
  await deleteStoredPhoto(current.photoUrl, owner.restaurant.id).catch(() => {});
  return NextResponse.json({ ok: true, revision });
}
