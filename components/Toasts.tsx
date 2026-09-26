"use client";
import { Toaster } from "sonner";

/** Small confirmation messages, like "Saved". Shown at the top, clear of the phone tab bar and menu dock. */
export function Toasts() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "var(--color-ink)",
          // The theme's white, which is dark ink in dark mode, like every inverted section.
          color: "var(--color-white)",
          border: "none",
          borderRadius: "1rem",
          boxShadow: "var(--depth-raised)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
