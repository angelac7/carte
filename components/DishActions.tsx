"use client";
import { useState } from "react";
import { toast } from "sonner";
import { DiaryEditor } from "@/components/DiaryEditor";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import { findDiaryEntry, isDishSaved, toggleSavedDish, type DishRef } from "@/lib/my-carte";
import { updateMyCarte, useMyCarte } from "@/lib/my-carte-store";
import type { MenuItem } from "@/types/menu";

type DishActionsProps = {
  dish: MenuItem;
  restaurant: { name: string; slug: string; cuisine: string };
  language: LanguageCode;
};

const pill = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-[box-shadow,background-color,color] duration-200 ${
    active
      ? "bg-ink text-white shadow-pressed-color"
      : "bg-paper text-muted shadow-raised-sm hover:text-ink active:shadow-pressed-sm"
  }`;

/** Save a dish or mark it tried, stored in My Carte on this device. */
export function DishActions({ dish, restaurant, language }: DishActionsProps) {
  const t = MY_CARTE_STRINGS[language];
  const state = useMyCarte();
  const [editing, setEditing] = useState(false);

  const ref: DishRef = {
    dishId: dish.id,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    restaurantName: restaurant.name,
    restaurantSlug: restaurant.slug,
    cuisine: restaurant.cuisine,
  };
  const saved = isDishSaved(state, dish.id);
  const entry = findDiaryEntry(state, dish.id);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        aria-pressed={saved}
        onClick={() => {
          updateMyCarte((current) => toggleSavedDish(current, ref, Date.now()));
          if (!saved) toast(`♥ ${t.saved}`);
        }}
        className={pill(saved)}
      >
        {saved ? `♥ ${t.saved}` : `♡ ${t.save}`}
      </button>
      <button onClick={() => setEditing(true)} className={pill(Boolean(entry))}>
        {entry ? t.triedRating(entry.rating) : t.tried}
      </button>
      {editing && (
        <DiaryEditor
          dish={ref}
          entry={entry}
          language={language}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
