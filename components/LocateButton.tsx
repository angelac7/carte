"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type LocateButtonProps = { label: string; locatingLabel: string; failedLabel: string };

/** Fills in the diner's approximate location (about 100 m) and searches. */
export function LocateButton({ label, locatingLabel, failedLabel }: LocateButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "locating" | "failed">("idle");

  function locate() {
    const form = buttonRef.current?.form;
    if (!form || !("geolocation" in navigator)) {
      setState("failed");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const set = (name: string, value: string) => {
          const input = form.elements.namedItem(name);
          if (input instanceof HTMLInputElement) input.value = value;
        };
        // Rounded for privacy: 3 decimal places is roughly a city block.
        set("lat", position.coords.latitude.toFixed(3));
        set("lon", position.coords.longitude.toFixed(3));
        set("near", "");
        form.requestSubmit();
      },
      () => setState("failed"),
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <Button
        ref={buttonRef}
        type="button"
        onClick={locate}
        disabled={state === "locating"}
        variant="secondary"
        size="lg"
      >
        {state === "locating" ? locatingLabel : label}
      </Button>
      {state === "failed" && (
        <span role="alert" className="text-sm text-tomato">
          {failedLabel}
        </span>
      )}
    </span>
  );
}
