"use client";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import type { DisplayPrefs } from "@/lib/display-prefs";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import type { LanguageCode } from "@/lib/languages";

type DisplaySettingsProps = {
  language: LanguageCode;
  display: DisplayPrefs;
  onChange: (display: DisplayPrefs) => void;
  onClose: () => void;
};

/** Larger text and high contrast, remembered on this device. */
export function DisplaySettings({ language, display, onChange, onClose }: DisplaySettingsProps) {
  const t = HELP_STRINGS[language];
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
    </Sheet>
  );
}
