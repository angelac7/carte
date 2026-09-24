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
          color: "#ffffff",
          border: "none",
          borderRadius: "1rem",
          boxShadow: "var(--depth-raised)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
