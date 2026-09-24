"use client";
import { Toaster } from "sonner";

/** Small confirmation messages that slide up from the bottom, like "Saved". */
export function Toasts() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "var(--color-ink)",
          color: "#ffffff",
          border: "none",
          borderRadius: "0.5rem",
        },
      }}
    />
  );
}
