"use client";
import { PhraseCards } from "@/components/PhraseCards";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { ALLERGENS, type Allergen } from "@/lib/allergens";
import { SEVERITIES, type Severity } from "@/lib/diner-prefs";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { htmlLang, ORIGINAL_LANGUAGE, type LanguageCode } from "@/lib/languages";

type AllergyCardProps = {
  language: LanguageCode;
  avoid: Allergen[];
  severity?: Severity;
  onSeverity?: (severity: Severity) => void;
  onToggle: (allergen: Allergen) => void;
  onClose: () => void;
  /** The language staff read. Uses fixed translations when the menu source language is supported. */
  staffLanguage?: LanguageCode;
};

/**
 * What the diner tells staff, in one language: their allergies, how serious they are, and the
 * request. Fixed translations only, never AI. Shared by the card and "Show to server".
 */
export function AllergyStatement({
  language,
  avoid,
  severity = "allergy",
  large = true,
}: {
  language: LanguageCode;
  avoid: Allergen[];
  severity?: Severity;
  large?: boolean;
}) {
  const t = TABLE_STRINGS[language];
  const names = avoid.map((allergen) => DINER_STRINGS[language].allergens[allergen]);
  return (
    <div lang={htmlLang(language)}>
      <p className={large ? "text-lg" : "font-medium"}>
        {severity === "intolerance" ? t.statementIntolerance : t.statement}
      </p>
      <p className={large ? "mt-2 font-serif text-3xl leading-snug" : "mt-1 text-xl"}>
        {formatList(names, language)}
      </p>
      {severity === "severe" && (
        <p className="mt-3 font-semibold leading-relaxed text-tomato">{t.severeNote}</p>
      )}
      <p className={large ? "mt-3 leading-relaxed" : "mt-2 text-sm leading-relaxed"}>{t.request}</p>
    </div>
  );
}

/** A card diners show staff, in their language with the staff's language underneath. */
export function AllergyCard({
  language,
  avoid,
  severity = "allergy",
  onSeverity,
  onToggle,
  onClose,
  staffLanguage = ORIGINAL_LANGUAGE,
}: AllergyCardProps) {
  const t = TABLE_STRINGS[language];
  const d = DINER_STRINGS[language];

  return (
    <Sheet title={t.cardTitle} closeLabel={t.close} onClose={onClose}>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">{t.chooseAllergies}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <ToggleChip
              key={allergen}
              label={d.allergens[allergen]}
              tone="ink"
              pressed={avoid.includes(allergen)}
              onToggle={() => onToggle(allergen)}
            />
          ))}
        </div>
      </fieldset>

      {onSeverity && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">{t.severityLabel}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEVERITIES.map((level) => (
              <ToggleChip
                key={level}
                label={t.severities[level]}
                tone="ink"
                pressed={severity === level}
                onToggle={() => onSeverity(level)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {avoid.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t.noAllergies}</p>
      ) : (
        <div className="mt-6 rounded-control border-2 border-tomato bg-paper p-5">
          <p className="text-sm text-muted">{t.cardIntro}</p>
          <div className="mt-3">
            <AllergyStatement language={language} avoid={avoid} severity={severity} />
          </div>
          {language !== staffLanguage && (
            <div className="mt-5 border-t border-line pt-4">
              <p lang={htmlLang(staffLanguage)} className="text-sm text-muted">
                {TABLE_STRINGS[staffLanguage].forStaff}
              </p>
              <div className="mt-2">
                <AllergyStatement language={staffLanguage} avoid={avoid} severity={severity} />
              </div>
            </div>
          )}
        </div>
      )}

      <PhraseCards language={language} staffLanguage={staffLanguage} />
    </Sheet>
  );
}
