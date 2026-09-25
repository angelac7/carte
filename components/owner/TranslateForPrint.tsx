"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchTranslations } from "@/lib/api-client";
import type { LanguageCode } from "@/lib/languages";

/** Translates the dishes that don't have a saved translation yet, then refreshes the page. */
export function TranslateForPrint({ slug, language }: { slug: string; language: LanguageCode }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={state === "working"}
        onClick={async () => {
          setState("working");
          try {
            await fetchTranslations(slug, language);
            setState("idle");
            router.refresh();
          } catch {
            setState("failed");
          }
        }}
      >
        {state === "working" ? "Translating…" : "Translate them now"}
      </Button>
      {state === "failed" && (
        <span className="text-sm text-tomato">Translation failed. Try again.</span>
      )}
    </div>
  );
}
