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
  `rounded-full border px-3 py-1.5 text-xs transition-colors ${
    active
      ? "border-ink bg-ink text-white"
      : "border-line text-muted hover:border-muted hover:text-ink"
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
