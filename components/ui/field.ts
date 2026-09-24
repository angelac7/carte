import { cn } from "@/lib/cn";

/** Shared styling for text inputs, selects, and textareas. */
export function fieldClass(className?: string) {
  return cn(
    "w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink transition-colors",
    "placeholder:text-muted/70 focus:border-ink focus:outline-none disabled:opacity-60",
    className,
  );
}

/** Shared styling for a field's label text. */
export const labelClass = "block text-sm font-medium";
