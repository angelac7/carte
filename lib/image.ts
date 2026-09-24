import { isSupportedImage } from "@/lib/upload-rules";

/** The longest side the AI reads at full detail, so menu photos keep small print legible. */
export const MENU_PHOTO_SIDE = 2576;

/**
 * Resizes large photos in the browser so uploads and AI reading stay fast.
 * Converts browser-decodable formats into JPEG; unsupported formats must be exported first.
 */
export async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    if (scale === 1 && file.size < 1_500_000 && isSupportedImage(file.type)) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image resizing is unavailable.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Image conversion failed."))),
        "image/jpeg",
        0.85,
      ),
    );
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    image.close();
  }
}
