"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/Chip";
import { Sheet } from "@/components/Sheet";
import { fetchInsight } from "@/lib/api-client";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISH_STRINGS } from "@/lib/i18n/dish-strings";
import { canSpeak, speak } from "@/lib/speak";
import type { LanguageCode } from "@/lib/languages";
import type { DishInsight } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

type DishText = { name: string; description: string; notes: string };

type DishSheetProps = {
  dish: MenuItem;
  text: DishText;
  language: LanguageCode;
  restaurantSlug: string;
  onClose: () => void;
};

// Remembers explanations during this visit, so reopening a dish is instant.
const insightCache = new Map<string, DishInsight>();

function Meter({ label, level, words }: { label: string; level: number; words: string[] }) {
  return (
    <div>
      <h3 className="eyebrow text-muted">{label}</h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-2 w-6 rounded-full ${step <= level ? "bg-accent" : "shadow-pressed-sm"}`}
            />
          ))}
        </span>
        <span className="text-sm">{words[level]}</span>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <h3 className="eyebrow text-muted">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="eyebrow text-muted">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** A detail card that explains one dish, opened by tapping "Details" on the diner menu. */
export function DishSheet({ dish, text, language, restaurantSlug, onClose }: DishSheetProps) {
  const t = DISH_STRINGS[language];
  const d = DINER_STRINGS[language];
  const key = `${dish.id}:${language}`;
  const [results, setResults] = useState<Record<string, DishInsight | "failed">>(() =>
    Object.fromEntries(insightCache),
  );
  const requested = useRef(new Set<string>());
  const result = results[key];
  const insight = result && result !== "failed" ? result : undefined;

  useEffect(() => {
    if (results[key] !== undefined || requested.current.has(key)) return;
    requested.current.add(key);
    fetchInsight(restaurantSlug, dish.id, language)
      .then((fresh) => {
        insightCache.set(key, fresh);
        setResults((prev) => ({ ...prev, [key]: fresh }));
      })
      .catch(() => setResults((prev) => ({ ...prev, [key]: "failed" })));
  }, [key, results, restaurantSlug, dish.id, language]);

  return (
    <Sheet
      title={text.name}
      closeLabel={t.close}
      onClose={onClose}
      media={
        dish.photo_url && (
          <Image
            src={dish.photo_url}
            alt={text.name}
            fill
            sizes="(min-width: 640px) 32rem, 100vw"
            className="object-cover"
          />
        )
      }
      subtitle={
        <>
          {text.name !== dish.name && (
            <p lang="en" className="mt-0.5 text-sm text-muted">
              {dish.name}
            </p>
          )}
          {insight?.nativeName && insight.nativeName !== dish.name && (
            <p lang={insight.nativeLang || undefined} className="mt-0.5 text-sm text-muted">
              {insight.nativeName}
            </p>
          )}
          {insight?.phonetic && (
            <p className="mt-0.5 text-sm text-muted italic">{insight.phonetic}</p>
          )}
        </>
      }
    >
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono tabular-nums">{dish.price}</span>
        {canSpeak() && (
          <button
            onClick={() => speak(insight?.nativeName || dish.name, insight?.nativeLang || "en-US")}
            className="rounded-full bg-paper px-4 py-2 text-sm font-medium shadow-raised-sm transition-[box-shadow,color] duration-200 hover:text-accent active:shadow-pressed-sm"
          >
            {t.listen}
          </button>
        )}
      </div>

      {text.description && (
        <p className="mt-4 text-sm leading-relaxed text-muted">{text.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {dish.allergens.length > 0 ? (
          <>
            <span className="eyebrow text-muted">{d.contains}</span>
            {dish.allergens.map((allergen) => (
              <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
            ))}
          </>
        ) : (
          <span className="text-muted">{d.noMajorAllergens}</span>
        )}
        {dish.dietary_tags.map((tag) => (
          <Chip key={tag} label={d.tags[tag]} tone="tag" />
        ))}
      </div>
      {text.notes && (
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-medium">{d.kitchenNote}</span> {text.notes}
        </p>
      )}

      <div className="mt-6 border-t border-ink/10 pt-6">
        {result === undefined && (
          <p role="status" className="text-sm text-muted">
            {t.loading}
          </p>
        )}
        {result === "failed" && (
          <p role="alert" className="text-sm text-tomato">
            {t.failed}
          </p>
        )}
        {insight && (
          <div className="space-y-5">
            <Section title={t.whatItIs} body={insight.summary} />
            <Section title={t.taste} body={insight.taste} />
            <div className="grid grid-cols-2 gap-4">
              <Meter label={t.spice} level={insight.spice} words={t.spiceLevels} />
              <Meter label={t.richness} level={insight.richness} words={t.richnessLevels} />
            </div>
            <div>
              <h3 className="eyebrow text-muted">{t.portion}</h3>
              <p className="mt-1 text-sm">{t.portionLabels[insight.portion]}</p>
              {insight.portionNote && (
                <p className="mt-1 text-sm leading-relaxed text-muted">{insight.portionNote}</p>
              )}
            </div>
            <Section title={t.background} body={insight.background} />
            {insight.glossary.length > 0 && (
              <div>
                <h3 className="eyebrow text-muted">{t.glossary}</h3>
                <dl className="mt-1 space-y-1 text-sm leading-relaxed">
                  {insight.glossary.map((entry) => (
                    <div key={entry.term}>
                      <dt className="inline font-medium">{entry.term}: </dt>
                      <dd className="inline text-muted">{entry.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {insight.pairings.length > 0 && <List title={t.pairings} items={insight.pairings} />}
            {insight.askKitchen.length > 0 && (
              <List title={t.askKitchen} items={insight.askKitchen} />
            )}
            <p className="text-xs leading-relaxed text-muted">{t.disclaimer}</p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
