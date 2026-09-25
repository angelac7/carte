"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PHRASE_IDS, PHRASE_STRINGS, type PhraseId } from "@/lib/i18n/phrase-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import { canSpeak, speak, SPEECH_LANG } from "@/lib/speak";

/**
 * Common questions for staff, in the diner's language with the staff's underneath. Tapping one
 * shows it large in the staff's language, with a button to read it aloud.
 */
export function PhraseCards({
  language,
  staffLanguage,
}: {
  language: LanguageCode;
  staffLanguage: LanguageCode;
}) {
  const [open, setOpen] = useState<PhraseId | null>(null);
  const t = PHRASE_STRINGS[language];
  const staff = PHRASE_STRINGS[staffLanguage];

  if (open) {
    return (
      <div className="mt-6 rounded-control border-2 border-ink p-5">
        <p lang={htmlLang(staffLanguage)} className="font-serif text-3xl leading-snug">
          {staff.phrases[open]}
        </p>
        {language !== staffLanguage && (
          <p lang={htmlLang(language)} className="mt-3 text-sm text-muted">
            {t.phrases[open]}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {canSpeak() && (
            <Button
              variant="secondary"
              onClick={() => speak(staff.phrases[open], SPEECH_LANG[staffLanguage])}
            >
              {t.listen}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(null)}>
            {TABLE_STRINGS[language].back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-6">
      <h3 className="text-sm font-medium">{t.title}</h3>
      <p className="mt-0.5 text-xs text-muted">{t.hint}</p>
      <ul className="mt-3 space-y-2">
        {PHRASE_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setOpen(id)}
              className="w-full rounded-control px-4 py-3 text-left shadow-raised-sm transition-[box-shadow] hover:shadow-raised active:shadow-pressed-sm"
            >
              <span lang={htmlLang(language)} className="block text-sm">
                {t.phrases[id]}
              </span>
              {language !== staffLanguage && (
                <span lang={htmlLang(staffLanguage)} className="mt-1 block text-xs text-muted">
                  {staff.phrases[id]}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
