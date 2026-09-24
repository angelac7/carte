import Image from "next/image";
import { DotPattern } from "@/components/motion/DotPattern";
import { cn } from "@/lib/cn";

const FALLBACKS = {
  warm: "radial-gradient(circle at 25% 20%, #f7dfae, transparent 55%), radial-gradient(circle at 80% 75%, #e9b765, transparent 50%), #fbf1da",
  basil:
    "radial-gradient(circle at 70% 25%, #bfe0cb, transparent 55%), radial-gradient(circle at 20% 80%, #8fc4a4, transparent 50%), #e6f1ea",
  ink: "radial-gradient(circle at 30% 30%, #3a4d63, transparent 55%), radial-gradient(circle at 75% 70%, #7a5000, transparent 45%), #1c2a39",
} as const;

type MediaFrameProps = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  tone?: keyof typeof FALLBACKS;
};

/** A photo that fills its frame, or a designed gradient when the photo hasn't been added yet. */
export function MediaFrame({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
  tone = "warm",
}: MediaFrameProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: FALLBACKS[tone] }}
        >
          <DotPattern className="text-white/40" />
        </div>
      )}
    </div>
  );
}
