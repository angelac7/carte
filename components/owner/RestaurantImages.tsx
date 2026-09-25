"use client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { removeRestaurantImage, uploadRestaurantImage } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { RestaurantImages as Images } from "@/lib/db/restaurant-images";
import { shrinkImage } from "@/lib/image";

const KINDS = {
  logo: {
    title: "Logo",
    hint: "Square works best. Shown beside your name on your menu.",
    frame: "aspect-square w-28",
    maxSide: 600,
  },
  cover: {
    title: "Cover photo",
    hint: "A wide photo of your food or room. Shown behind your name and on Discover.",
    frame: "aspect-[16/9] w-full max-w-sm",
    maxSide: 2000,
  },
} as const;

/** Upload, replace, or remove the restaurant's logo and cover photo. Saved right away. */
export function RestaurantImages({ initial }: { initial: Images }) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState<keyof typeof KINDS | null>(null);
  const [problem, setProblem] = useState("");

  async function change(kind: keyof typeof KINDS, file: File | null) {
    if (busy) return;
    setBusy(kind);
    setProblem("");
    try {
      if (file) {
        const url = await uploadRestaurantImage(kind, await shrinkImage(file, KINDS[kind].maxSide));
        setImages((prev) => ({ ...prev, [`${kind}_url`]: url }));
        toast(`${KINDS[kind].title} saved`);
      } else {
        await removeRestaurantImage(kind);
        setImages((prev) => ({ ...prev, [`${kind}_url`]: null }));
        toast(`${KINDS[kind].title} removed`);
      }
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The image couldn't be saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10 rounded-panel bg-paper p-6 shadow-raised sm:p-8">
      <h2 className="font-serif text-3xl tracking-tight">Logo and cover photo</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr]">
        {(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((kind) => {
          const url = images[`${kind}_url`];
          return (
            <div key={kind}>
              <p className="eyebrow text-muted">{KINDS[kind].title}</p>
              <div
                className={cn(
                  "relative mt-2 overflow-hidden rounded-[1.25rem]",
                  KINDS[kind].frame,
                  url ? "shadow-raised-sm" : "shadow-pressed",
                )}
              >
                {url ? (
                  <Image src={url} alt="" fill sizes="384px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted">
                    None yet
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xs text-xs text-muted">{KINDS[kind].hint}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label
                  className={cn(
                    "cursor-pointer py-2 text-sm font-medium underline underline-offset-4 hover:text-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                    busy && "pointer-events-none opacity-50",
                  )}
                >
                  {busy === kind ? "Saving…" : url ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      if (file) void change(kind, file);
                    }}
                  />
                </label>
                {url && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => change(kind, null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {problem && (
        <Notice tone="warning" role="alert" className="mt-4">
          {problem}
        </Notice>
      )}
    </section>
  );
}
