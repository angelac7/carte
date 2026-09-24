import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MediaFrameProps = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** Shown in a carved clay well when the photo hasn't been added yet. */
  placeholder?: ReactNode;
};

/** A photo that fills its frame, or a carved clay well with editorial type when there's no photo. */
export function MediaFrame({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
  placeholder,
}: MediaFrameProps) {
  return (
    <div className={cn("relative overflow-hidden", !src && "shadow-well", className)}>
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
          className="texture-grid absolute inset-0 flex items-center justify-center p-8"
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
