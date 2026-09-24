"use client";
import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import type { LanguageCode } from "@/lib/languages";
import { removeDiaryEntry, saveDiaryEntry, type DiaryEntry, type DishRef } from "@/lib/my-carte";
import { updateMyCarte } from "@/lib/my-carte-store";

type DiaryEditorProps = {
  dish: DishRef;
  entry?: DiaryEntry;
  language: LanguageCode;
  onClose: () => void;
};

/** Rate a dish from 1 to 5 stars and add a note, saved in the diner's food diary. */
export function DiaryEditor({ dish, entry, language, onClose }: DiaryEditorProps) {
  const t = MY_CARTE_STRINGS[language];
  const [rating, setRating] = useState(entry?.rating ?? 0);
  const [note, setNote] = useState(entry?.note ?? "");

  function save() {
    if (rating < 1) return;
    updateMyCarte((state) => saveDiaryEntry(state, dish, rating, note, Date.now()));
    onClose();
  }

  function remove() {
    updateMyCarte((state) => removeDiaryEntry(state, dish.dishId));
    onClose();
  }

  return (
    <Sheet title={t.rateTitle} closeLabel={TABLE_STRINGS[language].close} onClose={onClose}>
      <p className="mt-1 text-sm text-muted">{dish.name}</p>
      <div className="mt-4 flex gap-1" role="group" aria-label={t.rateTitle}>
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            aria-pressed={rating === stars}
            aria-label={t.stars(stars)}
            onClick={() => setRating(stars)}
            className={`text-3xl leading-none transition-colors hover:text-saffron ${
              stars <= rating ? "text-saffron" : "text-line"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium">{t.note}</span>
        <textarea
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          className={fieldClass("mt-2")}
        />
      </label>
      <div className="mt-5 flex items-center gap-4">
        <Button onClick={save} disabled={rating < 1}>
          {t.saveEntry}
        </Button>
        {entry && (
          <Button onClick={remove} variant="danger" size="sm">
            {t.removeEntry}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
