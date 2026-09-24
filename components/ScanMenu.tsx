"use client";
import { useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { Chip } from "@/components/Chip";
import type { Allergen } from "@/lib/allergens";
import { PhotoLimitError, scanMenu } from "@/lib/api-client";
import { writePrefsCookie, type DinerPrefs } from "@/lib/diner-prefs";
import { formatList } from "@/lib/format-list";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { shrinkImage } from "@/lib/image";
import {
  htmlLang,
  matchBrowserLanguage,
  ORIGINAL_LANGUAGE,
  type LanguageCode,
} from "@/lib/languages";
import { toggleValue } from "@/lib/toggle-value";
import type { ScannedMenu } from "@/types/camera";

type Status = "idle" | "loading" | "done" | "failed" | "limit";
type ScanMenuProps = { language: LanguageCode; initialPrefs: DinerPrefs };

/** Translate a paper menu from a restaurant that isn't on Carte, flagging possible allergens. */
export function ScanMenu({ language, initialPrefs }: ScanMenuProps) {
  const t = CAMERA_STRINGS[language];
  const d = DINER_STRINGS[language];
  const [status, setStatus] = useState<Status>("idle");
  const [menu, setMenu] = useState<ScannedMenu | null>(null);
  const [avoid, setAvoid] = useState<Allergen[]>(initialPrefs.avoid);
  const [cardOpen, setCardOpen] = useState(false);

  async function scan(file: File) {
    setStatus("loading");
    setMenu(null);
    try {
      setMenu(await scanMenu(language, await shrinkImage(file, 2000)));
      setStatus("done");
    } catch (err) {
      setStatus(err instanceof PhotoLimitError ? "limit" : "failed");
    }
  }

  function toggleAllergy(allergen: Allergen) {
    const next = toggleValue(avoid, allergen);
    setAvoid(next);
    writePrefsCookie({ avoid: next, onlyTags: initialPrefs.onlyTags });
  }

  // Show the allergy card in the menu's language when Carte supports it, otherwise English.
  const staffLanguage = menu?.menuLanguage
    ? matchBrowserLanguage([menu.menuLanguage])
    : ORIGINAL_LANGUAGE;

  const uploadButton = (
    <label className="inline-block cursor-pointer rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90 has-focus-visible:outline-2 has-focus-visible:outline-ink">
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
      {status === "done" ? t.scanAnother : t.takePhoto}
    </label>
  );

  return (
    <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 pt-4 pb-20">
      <div className="mt-8 flex flex-wrap gap-3">
        {uploadButton}
        <button
          onClick={() => setCardOpen(true)}
          className="rounded-md border border-line px-5 py-2.5 text-sm hover:border-muted"
        >
          {t.showCard}
        </button>
      </div>

      {status === "loading" && (
        <div role="status" className="mt-8">
          <p className="font-serif text-2xl">{t.reading}</p>
          <p className="mt-1 text-sm text-muted">{t.readingHint}</p>
        </div>
      )}
      {status === "failed" && (
        <p role="alert" className="mt-6 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">
          {t.scanFailed}
        </p>
      )}
      {status === "limit" && (
        <p role="alert" className="mt-6 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">
          {t.photoLimit}
        </p>
      )}

      {status === "done" && menu && (
        <section className="mt-8">
          <p
            role="note"
            className="rounded-md border border-tomato/40 bg-tomato/10 px-4 py-3 text-sm leading-relaxed text-tomato"
          >
            {t.warning}
          </p>

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

          {menu.dishes.length === 0 ? (
            <p className="mt-6 text-muted">{t.scanFailed}</p>
          ) : (
            <>
              <h2 className="mt-6 font-serif text-2xl">{t.dishesFound(menu.dishes.length)}</h2>
              <ul className="mt-4 space-y-3">
                {menu.dishes.map((dish, index) => {
                  const flagged = dish.allergens.filter((allergen) => avoid.includes(allergen));
                  return (
                    <li
                      key={index}
                      className={`rounded-lg border bg-card p-4 ${
                        flagged.length > 0 ? "border-2 border-tomato" : "border-line"
                      }`}
                    >
                      <p className="font-serif text-xl">{dish.name || dish.original}</p>
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
                            <span className="text-muted">{t.mayContain}</span>
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
            </>
          )}
        </section>
      )}

      {cardOpen && (
        <AllergyCard
          language={language}
          avoid={avoid}
          onToggle={toggleAllergy}
          onClose={() => setCardOpen(false)}
          staffLanguage={staffLanguage}
        />
      )}
    </main>
  );
}
