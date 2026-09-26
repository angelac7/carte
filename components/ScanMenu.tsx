"use client";
import { useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { Chip } from "@/components/Chip";
import { Button, buttonClass, fileButtonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { Allergen } from "@/lib/allergens";
import { PhotoLimitError, streamScan } from "@/lib/api-client";
import { useDinerPrefs } from "@/lib/use-diner-prefs";
import { type DinerPrefs } from "@/lib/diner-prefs";
import { formatList } from "@/lib/format-list";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { MENU_PHOTO_SIDE, shrinkImage } from "@/lib/image";
import {
  htmlLang,
  matchBrowserLanguage,
  ORIGINAL_LANGUAGE,
  type LanguageCode,
  textDirection,
} from "@/lib/languages";
import { toggleValue } from "@/lib/toggle-value";
import type { ScannedMenu } from "@/types/camera";

type Status = "idle" | "loading" | "done" | "failed" | "limit" | "partial";
type ScanMenuProps = { language: LanguageCode; initialPrefs: DinerPrefs };

/** Translate a paper menu from a restaurant that isn't on Carte, flagging possible allergens. */
export function ScanMenu({ language, initialPrefs }: ScanMenuProps) {
  const t = CAMERA_STRINGS[language];
  const d = DINER_STRINGS[language];
  const [status, setStatus] = useState<Status>("idle");
  const [menu, setMenu] = useState<ScannedMenu | null>(null);
  const [prefs, setPrefs] = useDinerPrefs(initialPrefs);
  const { avoid, onlyTags } = prefs;
  const [cardOpen, setCardOpen] = useState(false);

  async function scan(file: File) {
    setStatus("loading");
    setMenu({ menuLanguage: "", dishes: [] });
    try {
      // Dishes appear as soon as they're read.
      const partial = await streamScan(language, await shrinkImage(file, MENU_PHOTO_SIDE), {
        onLanguage: (menuLanguage) => setMenu((current) => current && { ...current, menuLanguage }),
        onDish: (dish) =>
          setMenu((current) => current && { ...current, dishes: [...current.dishes, dish] }),
      });
      setStatus(partial ? "partial" : "done");
    } catch (err) {
      // Keep any dishes already read, with the warning still showing above them.
      setStatus(err instanceof PhotoLimitError ? "limit" : "failed");
    }
  }

  function toggleAllergy(allergen: Allergen) {
    const next = toggleValue(avoid, allergen);
    setPrefs({ ...prefs, avoid: next, onlyTags });
  }

  const hasDishes = Boolean(menu && menu.dishes.length > 0);

  // Show the allergy card in the menu's language when Carte supports it, otherwise English.
  const staffLanguage = menu?.menuLanguage
    ? matchBrowserLanguage([menu.menuLanguage])
    : ORIGINAL_LANGUAGE;

  const uploadButton = (
    <label className={cn(buttonClass({ size: "lg", shine: status !== "done" }), fileButtonClass)}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={status === "loading"}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) scan(file);
          e.target.value = "";
        }}
      />
      {status === "done" || status === "partial" ? t.scanAnother : t.takePhoto}
    </label>
  );

  return (
    <main
      id="main"
      lang={htmlLang(language)}
      dir={textDirection(language)}
      className="mx-auto max-w-3xl px-5 pt-4 pb-20"
    >
      <div className="mt-8 flex flex-wrap gap-3">
        {uploadButton}
        <Button onClick={() => setCardOpen(true)} variant="secondary" size="lg">
          {t.showCard}
        </Button>
      </div>

      {/* Scanned menus are never confirmed, so this warning shows before and after every scan. */}
      <Notice tone="warning" className="mt-8">
        {t.warning}
      </Notice>
      <p className="mt-4 text-sm">
        {avoid.length > 0 ? (
          <>
            <span className="font-medium">{t.checking}</span>{" "}
            {formatList(
              avoid.map((allergen) => d.allergens[allergen]),
              language,
            )}
          </>
        ) : (
          <span className="text-muted">{t.noAllergiesSet}</span>
        )}
      </p>

      {status === "loading" && (
        <div role="status" className="mt-8">
          <p className="font-serif text-3xl tracking-tight">{t.reading}</p>
          <p className="mt-1 text-sm text-muted">{t.readingHint}</p>
          <div className="mt-6 space-y-3" aria-hidden="true" hidden={hasDishes}>
            {[0, 1, 2].map((row) => (
              <div key={row} className="rounded-panel p-6 shadow-pressed">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="mt-3 h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      )}
      {status === "partial" && (
        <Notice tone="warning" role="alert" className="mt-6">
          {t.scanPartial}
        </Notice>
      )}
      {status === "failed" && (
        <Notice tone="warning" role="alert" className="mt-6">
          {t.scanFailed}
        </Notice>
      )}
      {status === "limit" && (
        <Notice tone="warning" role="alert" className="mt-6">
          {t.photoLimit}
        </Notice>
      )}

      {menu && (hasDishes || status === "done") && (
        <section className="mt-2">
          {menu.dishes.length === 0 ? (
            <EmptyState className="mt-6">{t.scanFailed}</EmptyState>
          ) : (
            <>
              <h2 className="mt-10 border-t-4 border-ink pt-8 font-serif text-4xl leading-none tracking-tighter sm:text-5xl">
                {t.dishesFound(menu.dishes.length)}
              </h2>
              <ul className="mt-6 space-y-4">
                {menu.dishes.map((dish, index) => {
                  const flagged = dish.allergens.filter((allergen) => avoid.includes(allergen));
                  return (
                    <li
                      key={index}
                      // Unconfirmed dishes sit pressed into the page, never raised like confirmed ones.
                      className={`rounded-panel p-6 shadow-pressed ${
                        flagged.length > 0 ? "border-2 border-tomato" : ""
                      }`}
                    >
                      <p className="font-serif text-2xl leading-tight tracking-tight">
                        {dish.name || dish.original}
                      </p>
                      {dish.original && dish.original !== dish.name && (
                        <p className="mt-0.5 text-sm text-muted">{dish.original}</p>
                      )}
                      {dish.description && (
                        <p className="mt-1 text-sm leading-relaxed">{dish.description}</p>
                      )}
                      {flagged.length > 0 && (
                        <p className="mt-2 text-sm font-medium text-tomato">
                          {t.mayContain}:{" "}
                          {formatList(
                            flagged.map((allergen) => d.allergens[allergen]),
                            language,
                          )}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {dish.allergens.length > 0 ? (
                          <>
                            <span className="eyebrow text-muted">{t.mayContain}</span>
                            {dish.allergens.map((allergen) => (
                              <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
                            ))}
                          </>
                        ) : (
                          <span className="text-muted">{t.noneDetected}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {status === "loading" && (
                <div aria-hidden="true" className="mt-4 rounded-panel p-6 shadow-pressed">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="mt-3 h-4 w-4/5" />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {cardOpen && (
        <AllergyCard
          language={language}
          avoid={avoid}
          alsoAvoid={prefs.alsoAvoid ?? []}
          onToggleAlso={(item) =>
            setPrefs({ ...prefs, alsoAvoid: toggleValue(prefs.alsoAvoid ?? [], item) })
          }
          severity={prefs.severity}
          onSeverity={(severity) => setPrefs({ ...prefs, severity })}
          onToggle={toggleAllergy}
          onClose={() => setCardOpen(false)}
          staffLanguage={staffLanguage}
        />
      )}
    </main>
  );
}
