import "server-only";
import { supabaseUrl } from "@/lib/supabase/config";
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

/** Delete only a file in this restaurant's directory in our own bucket. */
export async function deleteStoredPhoto(
  url: string | null | undefined,
  restaurantId: string,
): Promise<void> {
  if (!url) return;
  let path: string;
  try {
    const photo = new URL(url);
    const project = new URL(supabaseUrl());
    const prefix = `/storage/v1/object/public/${BUCKET}/${restaurantId}/`;
    if (photo.origin !== project.origin || !photo.pathname.startsWith(prefix)) return;
    const name = photo.pathname.slice(prefix.length);
    if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(name)) return;
    path = `${restaurantId}/${name}`;
  } catch {
    return;
  }
  const { error } = await createAdminClient().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/** Deletes every photo in a restaurant's directory, for when its owner deletes their account. */
export async function deleteAllRestaurantPhotos(restaurantId: string): Promise<void> {
  const storage = createAdminClient().storage.from(BUCKET);
  for (;;) {
    const { data, error } = await storage.list(restaurantId, { limit: 100 });
    if (error) throw error;
    if (!data || data.length === 0) return;
    const { error: removeError } = await storage.remove(
      data.map((file) => `${restaurantId}/${file.name}`),
    );
    if (removeError) throw removeError;
  }
}

/** Stores a restaurant's logo or cover photo in its own folder, beside its dish photos. */
export function storeRestaurantImage(
  restaurantId: string,
  kind: "logo" | "cover",
  bytes: Buffer,
  contentType: SupportedImageType,
): Promise<string> {
  return storeDishPhoto(restaurantId, `restaurant-${kind}`, bytes, contentType);
}
