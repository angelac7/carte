import { cn } from "@/lib/cn";

/** Shared styling for text inputs, selects, and textareas: a well pressed into the clay. */
export function fieldClass(className?: string) {
  return cn(
    // 16px text on phones so iOS doesn't zoom in when a field is tapped.
    "w-full rounded-control bg-paper px-4 py-3 text-base text-ink shadow-pressed transition-shadow duration-200 sm:text-sm",
    "placeholder:text-muted/80 focus:shadow-well disabled:opacity-60",
    className,
  );
}

/** Shared styling for a field's label text. */
export const labelClass = "block text-sm font-medium";
