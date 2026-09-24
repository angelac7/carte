"use client";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { DishHeader } from "@/components/DishHeader";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { saveDishes, streamMenuImage } from "@/lib/api-client";
import { shrinkImage } from "@/lib/image";
import { isSupportedImage } from "@/lib/upload-rules";
import type { ExtractedDish } from "@/types/menu";

type Status = "idle" | "reading" | "ready" | "saving" | "saved" | "error";

export default function UploadPage() {
  const [dishes, setDishes] = useState<ExtractedDish[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  async function readMenu(file: File) {
    if (!isSupportedImage(file.type)) {
      setStatus("error");
      setError("Use a JPG, PNG, or WebP image of your menu.");
      return;
    }
    setFileName(file.name);
    setStatus("reading");
    setError("");
    setDishes([]);
    try {
      // Each dish appears as soon as it's read, so owners can start checking right away.
      await streamMenuImage(await shrinkImage(file), (dish) =>
        setDishes((current) => [...current, dish]),
      );
      setStatus("ready");
    } catch (err) {
      // Keep any dishes already read; the message says whether the menu was cut short.
      setStatus("error");
      setError(err instanceof Error ? err.message : "Carte couldn't read that menu. Try again.");
    }
  }

  async function saveAll() {
    setStatus("saving");
    try {
      await saveDishes(dishes);
      setStatus("saved");
    } catch {
      setStatus("error");
      setError("Your dishes weren't saved. Check that Carte is still running, then try again.");
    }
  }

  const reading = status === "reading";

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <OwnerPageHeader
        title="Turn your menu into an allergen guide."
        intro="Upload a photo of your menu. Carte lists every dish and suggests allergens, then you confirm each one before diners see it."
      />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) readMenu(file);
        }}
        className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-panel px-6 py-16 text-center transition-[box-shadow,outline-color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-accent ${
          dragging
            ? "shadow-well outline-2 outline-offset-4 outline-accent"
            : "shadow-pressed hover:shadow-well"
        } ${reading ? "pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={reading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readMenu(file);
            e.target.value = "";
          }}
        />
        <span className="font-serif text-3xl tracking-tight">
          {reading ? "Reading your menu…" : "Drop a menu photo here"}
        </span>
        <span className="mt-2 text-sm text-muted">
          {reading
            ? `Dishes from ${fileName} appear below as Carte reads them.`
            : "Or click to choose a file. JPG, PNG, or WebP, up to 10 MB."}
        </span>
      </label>

      {status === "error" && (
        <Notice tone="warning" role="alert" className="mt-4">
          {error}
        </Notice>
      )}

      {reading && dishes.length === 0 && (
        <div className="mt-8 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rounded-panel bg-paper p-6 shadow-raised">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-3 h-4 w-4/5" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {dishes.length > 0 && (
        <section className="mt-14 border-t-4 border-ink pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                aria-live="polite"
                className="font-serif text-4xl leading-none tracking-tighter sm:text-5xl"
              >
                {reading ? `${dishes.length} dishes so far` : `${dishes.length} dishes found`}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Allergens are suggestions. You’ll confirm each dish on the next step.
              </p>
            </div>
            {status === "saved" ? (
              <ButtonLink href="/dashboard/review" variant="basil" shine>
                Review dishes
              </ButtonLink>
            ) : (
              <Button onClick={saveAll} disabled={reading || status === "saving"} shine>
                {reading ? "Still reading…" : status === "saving" ? "Saving…" : "Save to menu"}
              </Button>
            )}
          </div>

          {status === "saved" && (
            <Notice tone="success" className="mt-4">
              Saved to your menu. Review each dish to confirm its allergens.
            </Notice>
          )}

          <ul className="mt-8 divide-y divide-ink/10 rounded-panel bg-paper px-6 shadow-raised sm:px-8">
            {dishes.map((dish, index) => (
              <li key={index} className="py-5">
                <DishHeader name={dish.name} price={dish.price} />
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                  {dish.description}
                </p>
                {(dish.likely_allergens.length > 0 || dish.dietary_tags.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dish.likely_allergens.map((allergen) => (
                      <Chip key={allergen} label={allergen} tone="allergen" />
                    ))}
                    {dish.dietary_tags.map((tag) => (
                      <Chip key={tag} label={tag} tone="tag" />
                    ))}
                  </div>
                )}
              </li>
            ))}
            {reading && (
              <li aria-hidden="true" className="py-5">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="mt-3 h-4 w-4/5" />
              </li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
