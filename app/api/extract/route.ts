import { NextResponse } from "next/server";
import { extractMenu } from "@/lib/ai/extract";
import { isSupportedImage, MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("menu");

  if (!(file instanceof File)) return fail("No menu image was uploaded.", 400);
  const mediaType = file.type;
  if (!isSupportedImage(mediaType)) return fail("Use a JPG, PNG, or WebP image of your menu.", 400);
  if (file.size > MAX_UPLOAD_BYTES)
    return fail("That image is over 10 MB. Use a smaller photo.", 413);

  try {
    const imageBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const items = await extractMenu(imageBase64, mediaType);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Menu extraction failed:", err);
    return fail(
      "Carte couldn't read that image. Try a sharper, well-lit photo where the text is easy to see.",
      500,
    );
  }
}
