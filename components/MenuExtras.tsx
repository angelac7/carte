"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PhotoLookup } from "@/components/PhotoLookup";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import {
  isRestaurantSaved,
  recordMenuSize,
  similarDishes,
  toggleSavedRestaurant,
} from "@/lib/my-carte";
import { updateMyCarte, useMyCarte } from "@/lib/my-carte-store";
import type { DishText, MenuItem } from "@/types/menu";

type MenuExtrasProps = {
  restaurant: { name: string; slug: string; cuisine: string };
  language: LanguageCode;
  allDishes: MenuItem[];
  menuSize: number;
  candidates: MenuItem[];
  textFor: (dish: MenuItem) => DishText;
  onOpenDish: (dishId: string) => void;
};

/** Save this menu, find a dish by photo, and see dishes similar to what the diner liked. */
export function MenuExtras({
  restaurant,
  language,
  allDishes,
  menuSize,
  candidates,
  textFor,
  onOpenDish,
}: MenuExtrasProps) {
  const t = MY_CARTE_STRINGS[language];
  const camera = CAMERA_STRINGS[language];
  const state = useMyCarte();
  const [photoOpen, setPhotoOpen] = useState(false);

  // Remember the menu's size for the Menu master challenge.
  useEffect(() => {
    updateMyCarte((current) => recordMenuSize(current, restaurant.slug, menuSize));
  }, [restaurant.slug, menuSize]);

  const saved = isRestaurantSaved(state, restaurant.slug);
  const liked = [...state.diary.filter((entry) => entry.rating >= 4), ...state.dishes];
  const alreadyKnown = new Set([
    ...state.diary.map((entry) => entry.dishId),
    ...state.dishes.map((dish) => dish.dishId),
  ]);
  const similar = similarDishes(liked, candidates, alreadyKnown, 3);
  const linkClass = "underline underline-offset-4 hover:text-muted";

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <button
          aria-pressed={saved}
          onClick={() =>
            updateMyCarte((current) => toggleSavedRestaurant(current, restaurant, Date.now()))
          }
          className={linkClass}
        >
          {saved ? `♥ ${t.menuSaved}` : `♡ ${t.saveMenu}`}
        </button>
        <button onClick={() => setPhotoOpen(true)} className={linkClass}>
          {camera.photoButton}
        </button>
        <Link href="/my" className={linkClass}>
          {t.myCarte}
        </Link>
      </div>

      {similar.length > 0 && (
        <div className="mt-4 rounded-lg border border-line bg-card p-4">
          <h2 className="text-sm font-medium">{t.similarTitle}</h2>
          <ul className="mt-2 space-y-1">
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

      {photoOpen && (
        <PhotoLookup
          restaurantSlug={restaurant.slug}
          language={language}
          dishes={allDishes}
          visibleIds={new Set(candidates.map((dish) => dish.id))}
          textFor={textFor}
          onOpenDish={(dishId) => {
            setPhotoOpen(false);
            onOpenDish(dishId);
          }}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </>
  );
}
