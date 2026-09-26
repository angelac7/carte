import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { getRestaurantImages, setRestaurantImage } from "@/lib/db/restaurant-images";
import { checkRateLimit } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import { deleteStoredPhoto, storeRestaurantImage } from "@/lib/storage/dish-photos";
import { reportError } from "@/lib/report-error";

const Kind = z.enum(["logo", "cover"]);

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Adds or replaces the restaurant's logo or cover photo. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail("Log in to manage your restaurant.", 401);
  if (!(await checkRateLimit(`photo-upload:${owner.user.id}`, 60, 60 * 60 * 1000))) {
    return fail("Too many uploads in the last hour. Try again later.", 429);
  }
  const form = await req.formData().catch(() => null);
  const kind = Kind.safeParse(form?.get("kind"));
  if (!kind.success) return fail("Choose a logo or a cover photo.", 400);
  const image = await readImageUpload(form?.get("image"));
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
    return fail("The image couldn't be saved. Try again.", 502);
  }
}

/** Removes the restaurant's logo or cover photo. */
export async function DELETE(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail("Log in to manage your restaurant.", 401);
  const body = (await req.json().catch(() => null)) as { kind?: unknown } | null;
  const kind = Kind.safeParse(body?.kind);
  if (!kind.success) return fail("Choose a logo or a cover photo.", 400);
  try {
    const previous = (await getRestaurantImages(owner.supabase, owner.restaurant.id))[
      kind.data === "logo" ? "logo_url" : "cover_url"
    ];
    await setRestaurantImage(owner.supabase, owner.restaurant.id, kind.data, null);
    await deleteStoredPhoto(previous, owner.restaurant.id).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    reportError("Removing a restaurant image failed", err);
    return fail("The image couldn't be removed. Try again.", 502);
  }
}
