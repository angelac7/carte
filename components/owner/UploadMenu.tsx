"use client";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { DishHeader } from "@/components/DishHeader";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { readMenuImage, saveDishes } from "@/lib/api-client";
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
      setDishes(await readMenuImage(await shrinkImage(file)));
      setStatus("ready");
    } catch (err) {
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
        className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
          dragging ? "border-ink bg-card" : "border-line bg-card/60 hover:border-muted"
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
        <span className="font-serif text-2xl">
          {reading ? "Reading your menu…" : "Drop a menu photo here"}
        </span>
        <span className="mt-2 text-sm text-muted">
          {reading
            ? `Reading ${fileName}. This usually takes about 20 seconds.`
            : "Or click to choose a file. JPG, PNG, or WebP, up to 10 MB."}
        </span>
      </label>

      {status === "error" && (
        <Notice tone="warning" role="alert" className="mt-4">
          {error}
        </Notice>
      )}

      {reading && (
        <div className="mt-8 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rounded-2xl border border-line bg-card p-5">
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
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl tracking-tight">{dishes.length} dishes found</h2>
              <p className="mt-1 text-sm text-muted">
                Allergens are suggestions. You’ll confirm each dish on the next step.
              </p>
            </div>
            {status === "saved" ? (
              <ButtonLink href="/dashboard/review" variant="basil" shine>
                Review dishes
              </ButtonLink>
            ) : (
              <Button onClick={saveAll} disabled={status === "saving"} shine>
                {status === "saving" ? "Saving…" : "Save to menu"}
              </Button>
            )}
          </div>

          {status === "saved" && (
            <Notice tone="success" className="mt-4">
              Saved to your menu. Review each dish to confirm its allergens.
            </Notice>
          )}

          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card px-5 sm:px-6">
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
          </ul>
        </section>
      )}
    </main>
  );
}
