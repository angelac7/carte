import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A quiet well pressed into the clay, for "nothing here yet" and "no results" messages. */
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-panel px-6 py-10 text-center text-muted shadow-pressed", className)}
    >
      {children}
    </div>
  );
}
