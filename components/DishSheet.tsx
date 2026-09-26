"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chip } from "@/components/Chip";
import { allergensChecked, type Allergen, type OtherAvoid } from "@/lib/allergens";
import { formatList } from "@/lib/format-list";
import { alsoUnchecked, mustLeaveOut, tracesOf } from "@/lib/menu-filters";
import { ReportDish } from "@/components/ReportDish";
import { Sheet } from "@/components/Sheet";
import { fetchInsight } from "@/lib/api-client";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISH_STRINGS } from "@/lib/i18n/dish-strings";
import { canSpeak, speak } from "@/lib/speak";
import type { LanguageCode } from "@/lib/languages";
import type { DishInsight } from "@/types/insight";
import type { DishText, MenuItem } from "@/types/menu";

type DishSheetProps = {
  dish: MenuItem;
  text: DishText;
  /** The diner's avoided allergens, to say what to leave out or watch for. */
  avoid?: Allergen[];
  /** Other things the diner avoids, like pork. */
  alsoAvoid?: OtherAvoid[];
  language: LanguageCode;
  restaurantSlug: string;
  /** Called once the explanation arrives, so the menu can show its summary too. */
  onExplained?: (insight: DishInsight) => void;
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

/** One part of the explanation, set in its own inset box. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-control p-4 shadow-pressed-sm sm:p-5">
      <h3 className="eyebrow text-muted">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 ps-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** A detail card that explains one dish, opened by tapping "Details" on the diner menu. */
export function DishSheet({
  dish,
  text,
  avoid = [],
  alsoAvoid = [],
  language,
  restaurantSlug,
  onExplained,
  onClose,
}: DishSheetProps) {
  const t = DISH_STRINGS[language];
  const d = DINER_STRINGS[language];
  // Includes the dish's version, so an edit during the visit fetches a fresh explanation.
  const key = `${dish.id}:${dish.revision ?? 0}:${language}`;
  const [results, setResults] = useState<Record<string, DishInsight | "failed">>(() =>
    Object.fromEntries(insightCache),
  );
  const requested = useRef(new Set<string>());
  const result = results[key];
  const insight = result && result !== "failed" ? result : undefined;
  const explained = useRef(onExplained);
  useEffect(() => {
    explained.current = onExplained;
  });
  useEffect(() => {
    if (insight) explained.current?.(insight);
  }, [insight]);

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
            className="rounded-full bg-paper px-4 py-2.5 text-sm font-medium shadow-raised-sm transition-[box-shadow,color] duration-200 hover:text-accent active:shadow-pressed-sm"
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
          <span className="text-muted">
            {d.noMajorAllergens(allergensChecked(dish.allergen_list))}
          </span>
        )}
        {dish.dietary_tags.map((tag) => (
          <Chip key={tag} label={d.tags[tag]} tone="tag" />
        ))}
      </div>
      {(dish.removable?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="eyebrow text-muted">{d.canBeWithout}</span>
          {dish.removable!.map((allergen) => (
            <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
          ))}
        </div>
      )}
      {(dish.may_contain?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="eyebrow text-muted">{d.mayContain}</span>
          {dish.may_contain!.map((allergen) => (
            <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
          ))}
        </div>
      )}
      {(dish.also_contains?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="eyebrow text-muted">{d.alsoContains}</span>
          {dish.also_contains!.map((item) => (
            <Chip key={item} label={d.alsoAvoid[item]} tone="allergen" />
          ))}
        </div>
      )}
      {alsoUnchecked(dish, alsoAvoid).length > 0 && (
        <p className="mt-3 rounded-control border border-saffron/40 bg-saffron-soft px-3 py-2 text-sm font-medium text-saffron-ink">
          {d.alsoUnchecked(
            formatList(
              alsoUnchecked(dish, alsoAvoid).map((item) => d.alsoAvoid[item]),
              language,
            ),
          )}
        </p>
      )}
      {mustLeaveOut(dish, avoid).length > 0 && (
        <p className="mt-3 rounded-control border border-saffron/40 bg-saffron-soft px-3 py-2 text-sm font-medium text-saffron-ink">
          {d.askWithout(
            formatList(
              mustLeaveOut(dish, avoid).map((allergen) => d.allergens[allergen]),
              language,
            ),
          )}
        </p>
      )}
      {tracesOf(dish, avoid).length > 0 && (
        <p className="mt-3 rounded-control border border-tomato/40 bg-tomato/10 px-3 py-2 text-sm font-medium text-tomato">
          {d.tracesWarning(
            formatList(
              tracesOf(dish, avoid).map((allergen) => d.allergens[allergen]),
              language,
            ),
          )}
        </p>
      )}
      {text.notes && (
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-medium">{d.kitchenNote}</span> {text.notes}
        </p>
      )}

      {(dish.sizes?.length ?? 0) > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="eyebrow text-muted">{d.sizes}</h3>
          <ul className="mt-1 space-y-1">
            {dish.sizes!.map((size, index) => (
              <li key={index} className="flex justify-between gap-4">
                <span>{text.options?.[index] || size.label}</span>
                <span className="font-mono tabular-nums">{size.price}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(dish.addons?.length ?? 0) > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="eyebrow text-muted">{d.addons}</h3>
          <ul className="mt-1 space-y-2">
            {dish.addons!.map((addon, index) => (
              <li key={index}>
                <div className="flex justify-between gap-4">
                  <span>{text.options?.[(dish.sizes?.length ?? 0) + index] || addon.label}</span>
                  {addon.price && <span className="font-mono tabular-nums">+{addon.price}</span>}
                </div>
                {addon.allergens.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="eyebrow text-muted">{d.contains}</span>
                    {addon.allergens.map((allergen) => (
                      <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
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
          <div className="space-y-4">
            {(insight.summary || insight.nameMeaning) && (
              <Group title={t.whatItIs}>
                {insight.summary && <p className="text-base">{insight.summary}</p>}
                {insight.nameMeaning && (
                  <p className="mt-3">
                    <span className="font-medium">{t.nameMeaning}:</span>{" "}
                    <span className="text-muted">{insight.nameMeaning}</span>
                  </p>
                )}
              </Group>
            )}
            {insight.glossary.length > 0 && (
              <Group title={t.glossary}>
                <dl className="divide-y divide-ink/10">
                  {insight.glossary.map((entry) => (
                    <div key={entry.term} className="py-2 first:pt-0 last:pb-0">
                      <dt className="font-medium">{entry.term}</dt>
                      <dd className="text-muted">{entry.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </Group>
            )}
            <Group title={t.taste}>
              {insight.taste && <p>{insight.taste}</p>}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Meter label={t.spice} level={insight.spice} words={t.spiceLevels} />
                <Meter label={t.richness} level={insight.richness} words={t.richnessLevels} />
              </div>
            </Group>
            <Group title={t.served}>
              <p>
                <span className="font-medium">{t.portionLabels[insight.portion]}</span>
                {insight.portionNote && (
                  <span className="text-muted"> · {insight.portionNote}</span>
                )}
              </p>
              {insight.pairings.length > 0 && (
                <>
                  <h4 className="mt-4 font-medium">{t.pairings}</h4>
                  <div className="mt-1">
                    <List items={insight.pairings} />
                  </div>
                </>
              )}
            </Group>
            {insight.background && (
              <Group title={t.background}>
                <p>{insight.background}</p>
              </Group>
            )}
            {insight.askKitchen.length > 0 && (
              <Group title={t.askKitchen}>
                <List items={insight.askKitchen} />
              </Group>
            )}
            <p className="text-xs leading-relaxed text-muted">{t.disclaimer}</p>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-ink/10 pt-4">
        <ReportDish restaurantSlug={restaurantSlug} dishId={dish.id} language={language} />
      </div>
    </Sheet>
  );
}
