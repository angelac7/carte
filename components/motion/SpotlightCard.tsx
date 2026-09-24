"use client";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SpotlightCardProps = { children: ReactNode; className?: string };

/** A card with a soft glow that follows the pointer. */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function follow(event: React.PointerEvent<HTMLDivElement>) {
    const card = ref.current;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--x", `${event.clientX - box.left}px`);
    card.style.setProperty("--y", `${event.clientY - box.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={follow}
      className={cn(
        "spotlight relative overflow-hidden rounded-control bg-paper shadow-raised-sm transition-shadow duration-300 hover:shadow-raised",
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
