import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A quiet dashed box for "nothing here yet" and "no results" messages. */
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
