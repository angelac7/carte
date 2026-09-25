"use client";
import Image from "next/image";
import { Chip } from "@/components/Chip";
import { allergensChecked, type Allergen } from "@/lib/allergens";
import { formatList } from "@/lib/format-list";
import { mustLeaveOut, tracesOf } from "@/lib/menu-filters";
import { DishActions } from "@/components/DishActions";
import { SparkleIcon } from "@/components/icons";
import { QuantityStepper } from "@/components/QuantityStepper";
import type { Availability } from "@/lib/availability";
import { cn } from "@/lib/cn";
import type { DinerStrings } from "@/lib/i18n/diner-strings";
import type { LanguageCode } from "@/lib/languages";
import { showOriginalName } from "@/lib/menu-search";
import type { DishText, MenuItem } from "@/types/menu";

type DishCardProps = {
  dish: MenuItem;
  text: DishText;
  /** A one-line AI explanation of what the dish is, when one has been written. */
  summary?: string;
  /** Whether the dish can be ordered right now. Unavailable dishes stay listed, with their allergens. */
  availability?: Availability;
  /** Its daily serving window, like "Served 11:00–15:00", if it has one. */
  servingWindow?: string;
  /** How spicy it is, like "Medium", when it's spicy at all. */
  spiceLabel?: string;
  /** One of the dishes diners open most here. */
  popular?: boolean;
  t: DinerStrings;
  /** The diner's avoided allergens, to say what to leave out or watch for. */
  avoid?: Allergen[];
  detailsLabel: string;
  explainLabel: string;
  stepperLabels: { add: string; increase: string; decrease: string };
  restaurant: { name: string; slug: string; cuisine: string };
  language: LanguageCode;
  quantity: number;
  onQuantity: (quantity: number) => void;
  /** For dishes with sizes or add-ons: opens the chooser instead of adding straight away. */
  onChoose?: () => void;
  onOpen: () => void;
};

/**
 * One dish on the diner menu. The whole card opens its details; saving, rating, and adding
 * to the order sit above that in their own buttons. Allergens and kitchen notes are always
 * shown in full and never animated.
 */
export function DishCard({
  dish,
  text,
  summary,
  availability = "available",
  servingWindow = "",
  spiceLabel = "",
  popular = false,
  t,
  avoid = [],
  detailsLabel,
  explainLabel,
  stepperLabels,
  restaurant,
  language,
  quantity,
  onQuantity,
  onChoose,
  onOpen,
}: DishCardProps) {
  return (
    <li className="group relative flex flex-col rounded-panel bg-paper shadow-raised transition-shadow duration-300 hover:shadow-raised-lg">
      {dish.photo_url && (
        <div className="relative m-3 mb-0 aspect-[16/9] overflow-hidden rounded-[1.5rem]">
          <Image
            src={dish.photo_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="min-w-0 font-serif text-2xl leading-tight tracking-tight">
            {/* Stretched over the card, so a tap anywhere outside the other buttons opens details. */}
            <button
              type="button"
              onClick={onOpen}
              aria-label={`${detailsLabel}: ${text.name}`}
              className="text-left after:absolute after:inset-0 after:rounded-panel after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-accent"
            >
              {text.name}
            </button>
          </h3>
          {dish.price && (
            <span className="shrink-0 font-mono text-base tabular-nums">{dish.price}</span>
          )}
        </div>
        {(dish.special ||
          availability !== "available" ||
          servingWindow ||
          spiceLabel ||
          popular) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            {popular && (
              <span className="rounded-full bg-ink px-3 py-1 text-white">{t.popular}</span>
            )}
            {spiceLabel && (
              <span className="rounded-full px-3 py-1 text-tomato shadow-pressed-sm">
                <span aria-hidden="true">🌶 </span>
                {spiceLabel}
              </span>
            )}
            {dish.special && (
              <span className="rounded-full bg-accent px-3 py-1 text-white">{t.special}</span>
            )}
            {availability === "sold-out" && (
              <span className="rounded-full bg-tomato px-3 py-1 text-white">{t.soldOut}</span>
            )}
            {servingWindow && (
              <span
                className={cn(
                  "rounded-full px-3 py-1",
                  availability === "not-now" ? "bg-ink text-white" : "shadow-pressed-sm",
                )}
              >
                {availability === "not-now"
                  ? `${t.notServedNow} · ${servingWindow}`
                  : servingWindow}
              </span>
            )}
          </div>
        )}
        {showOriginalName(text.name, dish.name) && (
          <p lang={dish.source_language || undefined} className="mt-1 text-sm text-muted">
            {dish.name}
          </p>
        )}
        {summary && (
          <p className="mt-3 flex gap-2 text-[0.9375rem] leading-snug">
            <span aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent">
              <SparkleIcon />
            </span>
            <span>{summary}</span>
          </p>
        )}
        {text.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{text.description}</p>
        )}
        {/* The whole card opens the explanation; this just says so. */}
        <p
          aria-hidden="true"
          className="mt-3 text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5"
        >
          {explainLabel} →
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {dish.allergens.length > 0 ? (
            <>
              <span className="eyebrow text-muted">{t.contains}</span>
              {dish.allergens.map((allergen) => (
                <Chip key={allergen} label={t.allergens[allergen]} tone="allergen" />
              ))}
            </>
          ) : (
            <span className="text-muted">
              {t.noMajorAllergens(allergensChecked(dish.allergen_list))}
            </span>
          )}
        </div>
        {(dish.may_contain?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="eyebrow text-muted">{t.mayContain}</span>
            {dish.may_contain!.map((allergen) => (
              <Chip key={allergen} label={t.allergens[allergen]} tone="allergen" />
            ))}
          </div>
        )}
        {mustLeaveOut(dish, avoid).length > 0 && (
          <p className="mt-3 rounded-control border border-saffron/40 bg-saffron-soft px-3 py-2 text-sm font-medium text-saffron-ink">
            {t.askWithout(
              formatList(
                mustLeaveOut(dish, avoid).map((allergen) => t.allergens[allergen]),
                language,
              ),
            )}
          </p>
        )}
        {tracesOf(dish, avoid).length > 0 && (
          <p className="mt-3 rounded-control border border-tomato/40 bg-tomato/10 px-3 py-2 text-sm font-medium text-tomato">
            {t.tracesWarning(
              formatList(
                tracesOf(dish, avoid).map((allergen) => t.allergens[allergen]),
                language,
              ),
            )}
          </p>
        )}
        {dish.dietary_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {dish.dietary_tags.map((tag) => (
              <Chip key={tag} label={t.tags[tag]} tone="tag" />
            ))}
          </div>
        )}
        {text.notes && (
          <p className="mt-3 text-sm leading-relaxed">
            <span className="font-medium">{t.kitchenNote}</span> {text.notes}
          </p>
        )}

        {/* Keeps the buttons along the bottom when cards in a row have different heights. */}
        <div aria-hidden="true" className="min-h-5 flex-1" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5">
          <DishActions dish={dish} restaurant={restaurant} language={language} />
          {availability === "available" && onChoose ? (
            <div className="flex items-center gap-3">
              {quantity > 0 && (
                <span className="text-sm text-muted tabular-nums">{t.inOrder(quantity)}</span>
              )}
              <button
                type="button"
                onClick={onChoose}
                className="rounded-full bg-paper px-5 py-2.5 text-sm font-semibold shadow-raised-sm transition-[box-shadow,color,transform] duration-200 ease-out hover:-translate-y-px hover:text-accent active:translate-y-px active:shadow-pressed-sm"
              >
                {t.chooseOptions}
              </button>
            </div>
          ) : availability === "available" ? (
            <QuantityStepper quantity={quantity} onChange={onQuantity} labels={stepperLabels} />
          ) : (
            <span className="text-sm font-medium text-muted">
              {availability === "sold-out" ? t.soldOut : t.notServedNow}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
