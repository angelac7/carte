import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportedImageType } from "@/lib/upload-rules";

const BUCKET = "dish-photos";
const EXTENSIONS: Record<SupportedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Stores a dish photo and returns its public address. Each upload gets a new name, so caches never show an old photo. */
export async function storeDishPhoto(
  restaurantId: string,
  dishId: string,
  bytes: Buffer,
  contentType: SupportedImageType,
): Promise<string> {
  const path = `${restaurantId}/${dishId}-${Date.now()}.${EXTENSIONS[contentType]}`;
  const storage = createAdminClient().storage.from(BUCKET);
  const { error } = await storage.upload(path, bytes, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Deletes a stored photo by its public address. Quietly ignores anything that isn't ours. */
export async function deleteStoredPhoto(url: string | null | undefined): Promise<void> {
  const path = url?.split(`/${BUCKET}/`)[1];
  if (!path) return;
  await createAdminClient().storage.from(BUCKET).remove([path]);
}
