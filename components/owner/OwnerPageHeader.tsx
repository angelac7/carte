import type { ReactNode } from "react";
import { BlurFade } from "@/components/motion/BlurFade";
import { cn } from "@/lib/cn";

type OwnerPageHeaderProps = {
  title: string;
  intro?: ReactNode;
  /** A small line above the title, like "Welcome back". */
  eyebrow?: string;
  /** Buttons or links under the intro. */
  children?: ReactNode;
};

/** The title block at the top of every dashboard page. */
export function OwnerPageHeader({ title, intro, eyebrow, children }: OwnerPageHeaderProps) {
  return (
    <BlurFade>
      <header className="print:hidden">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h1
          className={cn(
            "font-serif text-5xl leading-[0.95] tracking-tighter text-balance break-words sm:text-6xl",
            eyebrow && "mt-3",
          )}
        >
          {title}
        </h1>
        <div aria-hidden="true" className="mt-6 h-1 w-16 bg-ink" />
        {intro && <p className="mt-6 max-w-2xl leading-relaxed text-muted">{intro}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-4">{children}</div>}
      </header>
    </BlurFade>
  );
}
