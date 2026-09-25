"use client";
import { useEffect } from "react";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import { recordMenuSize, similarDishes } from "@/lib/my-carte";
import { updateMyCarte, useMyCarte } from "@/lib/my-carte-store";
import type { DishText, MenuItem } from "@/types/menu";

type MenuExtrasProps = {
  restaurant: { name: string; slug: string; cuisine: string };
  language: LanguageCode;
  menuSize: number;
  candidates: MenuItem[];
  textFor: (dish: MenuItem) => DishText;
  onOpenDish: (dishId: string) => void;
};

/** Shows dishes similar to what the diner liked before, and remembers the menu's size. */
export function MenuExtras({
  restaurant,
  language,
  menuSize,
  candidates,
  textFor,
  onOpenDish,
}: MenuExtrasProps) {
  const t = MY_CARTE_STRINGS[language];
  const state = useMyCarte();

  // Remember the menu's size for the Menu master challenge.
  useEffect(() => {
    updateMyCarte((current) => recordMenuSize(current, restaurant.slug, menuSize));
  }, [restaurant.slug, menuSize]);

  const liked = [...state.diary.filter((entry) => entry.rating >= 4), ...state.dishes];
  const alreadyKnown = new Set([
    ...state.diary.map((entry) => entry.dishId),
    ...state.dishes.map((dish) => dish.dishId),
  ]);
  const similar = similarDishes(liked, candidates, alreadyKnown, 3);

  return (
    <>
      {similar.length > 0 && (
        <div className="mt-6 rounded-panel p-6 shadow-pressed">
          <h2 className="eyebrow text-muted">{t.similarTitle}</h2>
          <ul className="mt-3 space-y-1.5">
            {similar.map((dish) => (
              <li key={dish.id}>
                <button
                  onClick={() => onOpenDish(dish.id)}
                  className="text-left text-sm underline underline-offset-4 hover:text-muted"
                >
                  {textFor(dish).name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
