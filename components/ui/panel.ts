import { cn } from "@/lib/cn";

/** A pillowy surface raised from the clay, for cards and grouped content. */
export function panelClass(className?: string) {
  return cn("rounded-panel bg-paper shadow-raised", className);
}

/** A surface pressed into the clay, for wells, empty states, and icon holders. */
export function wellClass(className?: string) {
  return cn("rounded-panel bg-paper shadow-well", className);
}
