import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Link previews use the standard 1.91:1 size most apps expect. */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

// Carte's own colors, matching app/globals.css.
const CLAY = "#e0e5ec";
const INK = "#0a0c10";
const ACCENT = "#1a47e8";

async function brandFonts() {
  const [serif, sans] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/PlayfairDisplay.ttf")),
    readFile(join(process.cwd(), "assets/fonts/DMSans.ttf")),
  ]);
  return [
    { name: "Playfair Display", data: serif, style: "normal" as const, weight: 400 as const },
    { name: "DM Sans", data: sans, style: "normal" as const, weight: 400 as const },
  ];
}

type ShareCardProps = {
  /** The big line, like a restaurant's name. */
  title: string;
  /** A smaller line under it, like "Korean · Brooklyn". */
  subtitle: string;
  /** A photo behind the text; without one, the card is set on Carte's clay color. */
  photo?: string | null;
};

/** A link-preview image in Carte's editorial style. */
export async function shareImage({ title, subtitle, photo }: ShareCardProps) {
  const dark = Boolean(photo);
  const text = dark ? "#ffffff" : INK;
  const titleSize = title.length > 28 ? 84 : title.length > 16 ? 110 : 140;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: dark ? INK : CLAY,
        fontFamily: "DM Sans",
      }}
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          width={SHARE_IMAGE_SIZE.width}
          height={SHARE_IMAGE_SIZE.height}
          style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }}
        />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px 72px",
          width: "100%",
          height: "100%",
          color: text,
          ...(dark && {
            backgroundImage: "linear-gradient(to top, rgba(10,12,16,0.95), rgba(10,12,16,0.2))",
          }),
        }}
      >
        <div
          style={{
            fontFamily: "Playfair Display",
            fontSize: titleSize,
            lineHeight: 0.95,
            letterSpacing: -3,
          }}
        >
          {title}
        </div>
        {subtitle && <div style={{ marginTop: 28, fontSize: 40, opacity: 0.85 }}>{subtitle}</div>}
        <div style={{ marginTop: 36, width: 120, height: 8, background: dark ? "#fff" : INK }} />
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            opacity: 0.8,
          }}
        >
          <span style={{ fontFamily: "Playfair Display", fontSize: 36 }}>Carte</span>
          <span
            style={{
              marginLeft: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: dark ? "#fff" : ACCENT,
            }}
          >
            Allergen filters · 7 languages
          </span>
        </div>
      </div>
    </div>,
    { ...SHARE_IMAGE_SIZE, fonts: await brandFonts() },
  );
}
