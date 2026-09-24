import { isSupportedImage, MAX_UPLOAD_BYTES, type SupportedImageType } from "@/lib/upload-rules";

export type ImageUpload =
  | { ok: true; base64: string; mediaType: SupportedImageType }
  | { ok: false; message: string; status: number };

/** Checks an uploaded image's type and size, then reads it for the AI. */
export async function readImageUpload(
  file: FormDataEntryValue | null | undefined,
): Promise<ImageUpload> {
  if (!(file instanceof File)) return { ok: false, message: "No image was uploaded.", status: 400 };
  const mediaType = file.type;
  if (!isSupportedImage(mediaType)) {
    return { ok: false, message: "Use a JPG, PNG, or WebP image.", status: 400 };
  }
  if (file.size === 0) return { ok: false, message: "The image is empty.", status: 400 };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "That image is over 10 MB.", status: 413 };
  }
  return { ok: true, base64: Buffer.from(await file.arrayBuffer()).toString("base64"), mediaType };
}
