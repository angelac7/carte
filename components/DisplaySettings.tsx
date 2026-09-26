"use client";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import type { DisplayPrefs } from "@/lib/display-prefs";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { fieldClass } from "@/components/ui/field";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import { CONVERTIBLE_CURRENCIES } from "@/lib/prices";

type DisplaySettingsProps = {
  language: LanguageCode;
  display: DisplayPrefs;
  onChange: (display: DisplayPrefs) => void;
  onClose: () => void;
  /**
   * The menu's currency and today's rates, when prices can be converted. Without them, the
   * currency choice isn't shown.
   */
  conversion?: { menuCurrency: string; ratesDate: string } | null;
};

/** Larger text, high contrast, and prices in the diner's currency, remembered on this device. */
export function DisplaySettings({
  language,
  display,
  onChange,
  onClose,
  conversion,
}: DisplaySettingsProps) {
  const t = HELP_STRINGS[language];
  const locale = htmlLang(language);
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  return (
    <Sheet title={t.display} closeLabel={TABLE_STRINGS[language].close} onClose={onClose}>
      <div className="mt-4 flex flex-wrap gap-2">
        <ToggleChip
          label={t.largeText}
          tone="ink"
          pressed={display.largeText}
          onToggle={() => onChange({ ...display, largeText: !display.largeText })}
        />
        <ToggleChip
          label={t.highContrast}
          tone="ink"
          pressed={display.highContrast}
          onToggle={() => onChange({ ...display, highContrast: !display.highContrast })}
        />
      </div>
      {conversion && (
        <label className="mt-6 block">
          <span className="text-sm font-medium">{t.showPricesIn}</span>
          <select
            value={display.currency ?? ""}
            onChange={(event) =>
              onChange({ ...display, currency: event.target.value || undefined })
            }
            className={fieldClass("mt-2")}
          >
            <option value="">{t.dontConvert}</option>
            {CONVERTIBLE_CURRENCIES.filter((code) => code !== conversion.menuCurrency).map(
              (code) => (
                <option key={code} value={code}>
                  {names.of(code) ?? code} ({code})
                </option>
              ),
            )}
          </select>
          <span className="mt-2 block text-xs text-muted">
            {t.ratesNote(
              new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
                new Date(`${conversion.ratesDate}T12:00:00Z`),
              ),
            )}
          </span>
        </label>
      )}
    </Sheet>
  );
}
