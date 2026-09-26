"use client";
import { useState } from "react";
import { AllergyStatement } from "@/components/AllergyCard";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import {
  hasAllergies,
  tableAllergyRows,
  type MyAllergies,
  type TableAllergyEntry,
} from "@/lib/table-allergies";

type TableAllergiesProps = {
  language: LanguageCode;
  staffLanguage: LanguageCode;
  /** This diner's current allergy settings. */
  mine: MyAllergies;
  /** Everyone's shared allergies, by each phone's random id. */
  allergies: Record<string, TableAllergyEntry>;
  me: string | null;
  onShare: (entry: TableAllergyEntry | null) => Promise<void>;
};

/**
 * At a shared table: share your allergies if you choose, and show the server one card for
 * everyone who did. Fixed translations only, like the personal allergy card.
 */
export function TableAllergies({
  language,
  staffLanguage,
  mine,
  allergies,
  me,
  onShare,
}: TableAllergiesProps) {
  const t = TABLE_STRINGS[language];
  const staff = TABLE_STRINGS[staffLanguage];
  const shared = me ? allergies[me] : undefined;
  const [label, setLabel] = useState(shared?.label ?? "");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const people = tableAllergyRows(allergies, me, t.guest);
  const forStaff = tableAllergyRows(allergies, me, staff.guest);

  async function share(entry: TableAllergyEntry | null) {
    setBusy(true);
    setFailed(false);
    try {
      await onShare(entry);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="table-allergies" className="mt-6 border-t border-line pt-5">
      <h3 id="table-allergies" className="font-medium">
        {t.tableAllergiesTitle}
      </h3>
      <p className="mt-1 text-sm text-muted">{t.tableAllergiesHint}</p>

      {shared ? (
        <Button
          size="sm"
          variant="ghost"
          className="mt-3"
          disabled={busy}
          onClick={() => share(null)}
        >
          {t.stopSharingMine}
        </Button>
      ) : !hasAllergies(mine) ? (
        <p className="mt-3 text-sm">
          {t.tableAllergiesNone(DINER_STRINGS[language].filtersButton)}
        </p>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void share({ ...mine, label: label.trim() });
          }}
        >
          <label className="block">
            <span className={labelClass}>{t.yourNameOrSeat}</span>
            <input
              value={label}
              maxLength={24}
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
              className={fieldClass("mt-1 w-52")}
            />
          </label>
          <Button type="submit" size="sm" disabled={busy}>
            {t.shareMine}
          </Button>
        </form>
      )}
      {failed && (
        <Notice tone="warning" role="alert" className="mt-3">
          {t.shareFailed}
        </Notice>
      )}

      {people.length > 0 && (
        <>
          <p className="mt-4 text-sm">
            {formatList(
              people.map((person) => (person.mine ? `${person.name} (${t.you})` : person.name)),
              language,
            )}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            aria-expanded={showCard}
            onClick={() => setShowCard(!showCard)}
          >
            {showCard ? t.hideTableCard : t.showTableCard}
          </Button>
          {showCard && (
            <div className="mt-4 rounded-control border-2 border-tomato bg-paper p-5">
              <p className="text-sm text-muted">{t.cardIntro}</p>
              <div lang={htmlLang(staffLanguage)}>
                <p className="mt-2 font-serif text-2xl">{staff.tableAllergiesTitle}</p>
                <ul className="mt-2 divide-y divide-line">
                  {forStaff.map((person) => (
                    <li key={person.person} className="py-3">
                      <p className="font-semibold">{person.name}</p>
                      <div className="mt-1">
                        <AllergyStatement
                          language={staffLanguage}
                          avoid={person.entry.avoid}
                          alsoAvoid={person.entry.alsoAvoid}
                          severity={person.entry.severity}
                          large={false}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
