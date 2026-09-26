import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { getRestaurantImages, setRestaurantImage } from "@/lib/db/restaurant-images";
import { checkRateLimit } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import { deleteStoredPhoto, storeRestaurantImage } from "@/lib/storage/dish-photos";
import { reportError } from "@/lib/report-error";
import { ownerStrings } from "@/lib/owner-language";

const Kind = z.enum(["logo", "cover"]);

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Adds or replaces the restaurant's logo or cover photo. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginRestaurant, 401);
  if (!(await checkRateLimit(`photo-upload:${owner.user.id}`, 60, 60 * 60 * 1000))) {
    return fail(t.api.tooManyUploads, 429);
  }
  const form = await req.formData().catch(() => null);
  const kind = Kind.safeParse(form?.get("kind"));
  if (!kind.success) return fail(t.api.chooseImage, 400);
  const image = await readImageUpload(form?.get("image"), t.api.image);
  if (!image.ok) return fail(image.message, image.status);

  try {
    const previous = (await getRestaurantImages(owner.supabase, owner.restaurant.id))[
      kind.data === "logo" ? "logo_url" : "cover_url"
    ];
    const url = await storeRestaurantImage(
      owner.restaurant.id,
      kind.data,
      Buffer.from(image.base64, "base64"),
      image.mediaType,
    );
    try {
      await setRestaurantImage(owner.supabase, owner.restaurant.id, kind.data, url);
    } catch (error) {
      await deleteStoredPhoto(url, owner.restaurant.id).catch(() => {});
      throw error;
    }
    await deleteStoredPhoto(previous, owner.restaurant.id).catch(() => {});
    return NextResponse.json({ url });
  } catch (err) {
    reportError("Restaurant image upload failed", err);
    return fail(t.api.imageSaveFailed, 502);
  }
}

/** Removes the restaurant's logo or cover photo. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginRestaurant, 401);
  const body = (await req.json().catch(() => null)) as { kind?: unknown } | null;
  const kind = Kind.safeParse(body?.kind);
  if (!kind.success) return fail(t.api.chooseImage, 400);
  try {
    const previous = (await getRestaurantImages(owner.supabase, owner.restaurant.id))[
      kind.data === "logo" ? "logo_url" : "cover_url"
    ];
    await setRestaurantImage(owner.supabase, owner.restaurant.id, kind.data, null);
    await deleteStoredPhoto(previous, owner.restaurant.id).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    reportError("Removing a restaurant image failed", err);
    return fail(t.api.imageRemoveFailed, 502);
  }
}
