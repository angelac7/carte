import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Card styling: a raised clay surface that lifts a little further on hover. */
export const cardClass =
  "group overflow-hidden rounded-panel bg-paper shadow-raised transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-raised-lg";

type CardImageProps = {
  src: string | null | undefined;
  alt: string;
  index?: number;
  monogram?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * A card's photo, set into the card like a window and zooming slightly on hover.
 * Without a photo, a carved well with the first letter in large serif type.
 */
export function CardImage({ src, alt, index = 0, monogram, className, children }: CardImageProps) {
  return (
    <div className="p-3">
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-[1.5rem]",
          !src && "shadow-well",
          className,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className={cn("texture-grid absolute inset-0", index % 2 === 1 && "bg-ink/[0.03]")}
          >
            {monogram && (
              <span className="absolute inset-0 flex items-center justify-center font-serif text-7xl text-ink/70 italic transition-transform duration-500 group-hover:scale-110">
                {monogram}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

type BadgeProps = { children: ReactNode; tone?: "light" | "basil" | "dark"; className?: string };

/** A small mono label floating over a card's photo. */
export function Badge({ children, tone = "light", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "eyebrow absolute top-3 start-3 rounded-full px-3 py-1.5 backdrop-blur",
        tone === "light" && "bg-paper/90 text-ink shadow-raised-sm",
        tone === "basil" && "bg-basil text-white",
        tone === "dark" && "bg-ink text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
