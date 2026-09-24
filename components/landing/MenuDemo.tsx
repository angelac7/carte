"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { toggleValue } from "@/lib/toggle-value";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
] as const;
type Code = (typeof LANGS)[number]["code"];

const DISHES: { id: string; price: string; allergens: string[]; names: Record<Code, string> }[] = [
  {
    id: "ramyun",
    price: "$18",
    allergens: ["wheat", "soy"],
    names: {
      en: "Spicy Pork Ramyun",
      ko: "매운 돼지고기 라면",
      es: "Ramyun de cerdo picante",
      ja: "豚肉の辛ラーメン",
      fr: "Ramyun épicé au porc",
    },
  },
  {
    id: "salmon",
    price: "$26",
    allergens: ["fish", "milk", "soy", "wheat"],
    names: {
      en: "Grilled Salmon, Miso Butter",
      ko: "연어구이와 된장 버터",
      es: "Salmón a la parrilla con mantequilla de miso",
      ja: "鮭のグリル 味噌バター",
      fr: "Saumon grillé, beurre au miso",
    },
  },
  {
    id: "bibimbap",
    price: "$16",
    allergens: ["eggs", "sesame", "soy"],
    names: {
      en: "Garden Bibimbap",
      ko: "야채 비빔밥",
      es: "Bibimbap de verduras",
      ja: "野菜ビビンバ",
      fr: "Bibimbap aux légumes",
    },
  },
  {
    id: "noodles",
    price: "$14",
    allergens: ["peanuts", "wheat", "sesame"],
    names: {
      en: "Cold Peanut Noodles",
      ko: "차가운 땅콩 국수",
      es: "Fideos fríos con cacahuate",
      ja: "冷たいピーナッツ麺",
      fr: "Nouilles froides aux cacahuètes",
    },
  },
];

const TRY_ALLERGENS = ["peanuts", "fish", "wheat", "milk", "sesame"];

/** A sample menu card that translates itself and hides dishes when a visitor taps an allergy. */
export function MenuDemo() {
  const [langIndex, setLangIndex] = useState(0);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setLangIndex((current) => (current + 1) % LANGS.length), 2600);
    return () => clearInterval(timer);
  }, [paused]);

  const lang = LANGS[langIndex];

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="rounded-2xl bg-card p-6 text-ink shadow-2xl ring-1 ring-black/5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-2xl">Maru Kitchen</p>
        <AnimatePresence mode="wait">
          <motion.span
            key={lang.code}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-full bg-paper px-3 py-1 text-xs text-muted"
          >
            {lang.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <ul className="mt-6 space-y-4">
        {DISHES.map((dish) => {
          const hidden = dish.allergens.some((allergen) => avoid.includes(allergen));
          return (
            <motion.li
              key={dish.id}
              animate={{ opacity: hidden ? 0.4 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-baseline">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${dish.id}-${lang.code}`}
                    lang={lang.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "font-serif text-lg",
                      hidden && "line-through decoration-tomato decoration-2",
                    )}
                  >
                    {dish.names[lang.code]}
                  </motion.span>
                </AnimatePresence>
                <span className="leader" aria-hidden="true" />
                <span className="tabular-nums">{dish.price}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {dish.allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                      avoid.includes(allergen)
                        ? "bg-tomato text-white"
                        : "bg-saffron-soft text-saffron-ink",
                    )}
                  >
                    {allergen}
                  </span>
                ))}
                <AnimatePresence>
                  {hidden && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-white"
                    >
                      Hidden for you
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-sm text-muted">Try it: tap an allergy.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRY_ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              type="button"
              aria-pressed={avoid.includes(allergen)}
              onClick={() => setAvoid((current) => toggleValue(current, allergen))}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-[transform,colors] active:scale-95",
                avoid.includes(allergen)
                  ? "border-ink bg-ink text-white"
                  : "border-line text-muted hover:border-muted hover:text-ink",
              )}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
