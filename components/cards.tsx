import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONES = [
  "radial-gradient(circle at 25% 20%, #f7dfae, transparent 55%), radial-gradient(circle at 80% 80%, #e9b765, transparent 50%), #fbf1da",
  "radial-gradient(circle at 70% 25%, #bfe0cb, transparent 55%), radial-gradient(circle at 20% 80%, #8fc4a4, transparent 50%), #e6f1ea",
  "radial-gradient(circle at 30% 30%, #3a4d63, transparent 55%), radial-gradient(circle at 75% 70%, #7a5000, transparent 45%), #1c2a39",
  "radial-gradient(circle at 60% 30%, #f3c9b8, transparent 55%), radial-gradient(circle at 20% 80%, #d98c73, transparent 50%), #fbe9e2",
];

/** Card styling: lifts and deepens its shadow on hover. */
export const cardClass =
  "group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl";

type CardImageProps = {
  src: string | null | undefined;
  alt: string;
  index?: number;
  monogram?: string;
  className?: string;
  children?: ReactNode;
};

/** A card's photo, zooming slightly on hover; a colorful gradient with a letter when there's no photo. */
export function CardImage({ src, alt, index = 0, monogram, className, children }: CardImageProps) {
  const zoom = "transition-transform duration-700 group-hover:scale-105";
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className={cn("object-cover", zoom)}
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn("absolute inset-0", zoom)}
          style={{ background: TONES[index % TONES.length] }}
        >
          {monogram && (
            <span className="absolute inset-0 flex items-center justify-center font-serif text-7xl text-white/70">
              {monogram}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

type BadgeProps = { children: ReactNode; tone?: "light" | "basil" | "dark"; className?: string };

/** A small label floating over a card's photo. */
export function Badge({ children, tone = "light", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur",
        tone === "light" && "bg-white/90 text-ink",
        tone === "basil" && "bg-basil text-white",
        tone === "dark" && "bg-ink/80 text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
