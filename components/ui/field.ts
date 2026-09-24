import { cn } from "@/lib/cn";

/** Shared styling for text inputs, selects, and textareas: a well pressed into the clay. */
export function fieldClass(className?: string) {
  return cn(
    "w-full rounded-control bg-paper px-4 py-2.5 text-sm text-ink shadow-pressed transition-shadow duration-200",
    "placeholder:text-muted/80 focus:shadow-well disabled:opacity-60",
    className,
  );
}

/** Shared styling for a field's label text. */
export const labelClass = "block text-sm font-medium";
