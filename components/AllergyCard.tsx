"use client";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { ALLERGENS, type Allergen } from "@/lib/allergens";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { htmlLang, ORIGINAL_LANGUAGE, type LanguageCode } from "@/lib/languages";

type AllergyCardProps = {
  language: LanguageCode;
  avoid: Allergen[];
  onToggle: (allergen: Allergen) => void;
  onClose: () => void;
  /** The language staff read. Carte menus are in English; scanned menus may differ. */
  staffLanguage?: LanguageCode;
};

function CardText({ language, avoid }: { language: LanguageCode; avoid: Allergen[] }) {
  const t = TABLE_STRINGS[language];
  const names = avoid.map((allergen) => DINER_STRINGS[language].allergens[allergen]);
  return (
    <div lang={htmlLang(language)}>
      <p className="text-lg">{t.statement}</p>
      <p className="mt-2 font-serif text-3xl leading-snug">{formatList(names, language)}</p>
      <p className="mt-3 leading-relaxed">{t.request}</p>
    </div>
  );
}

/** A card diners show staff, in their language with the staff's language underneath. */
export function AllergyCard({
  language,
  avoid,
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

      {avoid.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t.noAllergies}</p>
      ) : (
        <div className="mt-6 rounded-control border-2 border-tomato bg-paper p-5">
          <p className="text-sm text-muted">{t.cardIntro}</p>
          <div className="mt-3">
            <CardText language={language} avoid={avoid} />
          </div>
          {language !== staffLanguage && (
            <div className="mt-5 border-t border-line pt-4">
              <p lang={htmlLang(staffLanguage)} className="text-sm text-muted">
                {TABLE_STRINGS[staffLanguage].forStaff}
              </p>
              <div className="mt-2">
                <CardText language={staffLanguage} avoid={avoid} />
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
