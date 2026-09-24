import { isSupportedImage } from "@/lib/upload-rules";

/** The longest side the AI reads at full detail, so menu photos keep small print legible. */
export const MENU_PHOTO_SIDE = 2576;

/**
 * Resizes large photos in the browser so uploads and AI reading stay fast.
 * Also converts formats the AI can't read, like iPhone HEIC photos, into JPEG.
 */
export async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  if (scale === 1 && file.size < 1_500_000 && isSupportedImage(file.type)) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((result) => resolve(result!), "image/jpeg", 0.85),
  );
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
