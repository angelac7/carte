"use client";
import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { buttonClass, fileButtonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { askPhotoMatch, PhotoLimitError } from "@/lib/api-client";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import { DISH_STRINGS } from "@/lib/i18n/dish-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { shrinkImage } from "@/lib/image";
import type { LanguageCode } from "@/lib/languages";
import type { PhotoMatch } from "@/types/camera";
import type { DishText, MenuItem } from "@/types/menu";

type PhotoLookupProps = {
  restaurantSlug: string;
  language: LanguageCode;
  dishes: MenuItem[];
  visibleIds: Set<string>;
  textFor: (dish: MenuItem) => DishText;
  onOpenDish: (dishId: string) => void;
  onClose: () => void;
};

type Status = "idle" | "loading" | "done" | "failed" | "limit";

/** Snap a photo of a dish to find it on this menu. */
export function PhotoLookup({
  restaurantSlug,
  language,
  dishes,
  visibleIds,
  textFor,
  onOpenDish,
  onClose,
}: PhotoLookupProps) {
  const t = CAMERA_STRINGS[language];
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<PhotoMatch[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  async function search(file: File) {
    setStatus("loading");
    setMatches([]);
    try {
      const image = await shrinkImage(file);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(image);
      });
      setMatches(await askPhotoMatch(restaurantSlug, language, image));
      setStatus("done");
    } catch (err) {
      setStatus(err instanceof PhotoLimitError ? "limit" : "failed");
    }
  }

  const found = matches.flatMap((match) => {
    const dish = dishes.find((d) => d.id === match.id);
    return dish ? [{ dish, match }] : [];
  });

  return (
    <Sheet title={t.photoButton} closeLabel={TABLE_STRINGS[language].close} onClose={onClose}>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.photoIntro}</p>

      <label className={cn(buttonClass(), fileButtonClass, "mt-4")}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={status === "loading"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) search(file);
            e.target.value = "";
          }}
        />
        {t.takePhoto}
      </label>

      {preview && (
        // A local preview of the diner's own photo, so Next's image optimizer isn't needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-4 max-h-48 rounded-[1.25rem] object-cover shadow-raised-sm"
        />
      )}

      {status === "loading" && (
        <p role="status" className="mt-4 text-sm text-muted">
          {t.photoSearching}
        </p>
      )}
      {status === "failed" && (
        <p role="alert" className="mt-4 text-sm text-tomato">
          {t.photoFailed}
        </p>
      )}
      {status === "limit" && (
        <p role="alert" className="mt-4 text-sm text-tomato">
          {t.photoLimit}
        </p>
      )}
      {status === "done" && found.length === 0 && (
        <p className="mt-4 text-sm text-muted">{t.photoNone}</p>
      )}

      {found.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-line">
            {found.map(({ dish, match }) => (
              <li key={dish.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{textFor(dish).name}</p>
                  <span className="shrink-0 text-xs text-muted">
                    {match.confidence === "high" ? t.likely : t.possible}
                  </span>
                </div>
                {match.reason && <p className="mt-1 text-sm text-muted">{match.reason}</p>}
                {visibleIds.has(dish.id) ? (
                  <button
                    onClick={() => onOpenDish(dish.id)}
                    className="mt-2 text-sm font-medium underline underline-offset-4 hover:text-muted"
                  >
                    {DISH_STRINGS[language].details}
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-tomato">{t.hiddenByFilters}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">{t.photoDisclaimer}</p>
        </>
      )}
    </Sheet>
  );
}
