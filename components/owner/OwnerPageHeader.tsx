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
        {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
        <h1
          className={cn(
            "font-serif text-4xl leading-tight tracking-tight text-balance break-words sm:text-5xl",
            eyebrow && "mt-1",
          )}
        >
          {title}
        </h1>
        {intro && <p className="mt-3 max-w-2xl leading-relaxed text-muted">{intro}</p>}
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </header>
    </BlurFade>
  );
}
