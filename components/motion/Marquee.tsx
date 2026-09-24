import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  /** Seconds for one full loop. */
  duration?: number;
};

/** An endlessly scrolling row that pauses on hover and stops for reduced motion. */
export function Marquee({ children, className, reverse = false, duration = 40 }: MarqueeProps) {
  return (
    <div
      className={cn("group flex gap-(--gap) overflow-hidden [--gap:1rem]", className)}
      style={{ "--duration": `${duration}s` } as CSSProperties}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            "animate-marquee flex shrink-0 gap-(--gap) group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
