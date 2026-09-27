import { saveTranslationAction } from "@/app/dashboard/translations/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { listDishTranslations } from "@/lib/db/owner-translations";
import { fmt } from "@/lib/i18n/owner/format";
import { htmlLang, isLanguageCode, LANGUAGES, textDirection } from "@/lib/languages";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";
import { optionLabels, translationHash } from "@/lib/source-hash";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.translations.title);

const panelClass = "mt-6 rounded-panel bg-paper p-6 shadow-raised sm:p-8";
const FIELDS = ["name", "description", "notes", "section"] as const;

/** Lets a restaurant's team correct the AI's translation of each confirmed dish. */
export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; saved?: string; incomplete?: string; failed?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/translations");
  const { t, language } = await ownerStrings();
  const s = t.translations;
  const params = await searchParams;
  const fallback = language === "en" ? "es" : language;
  const target = params.lang && isLanguageCode(params.lang) ? params.lang : fallback;

  const confirmed = (await listDishes(supabase, restaurant.id)).filter((dish) => dish.confirmed);
  // Dishes already written in the language need no translation into it.
  const dishes = confirmed.filter((dish) => (dish.source_language ?? "und") !== target);
  const saved = new Map(
    (
      await listDishTranslations(
        supabase,
        dishes.map((dish) => dish.id),
        target,
      )
    ).map((row) => [row.menu_item_id, row]),
  );
  const label = { name: s.name, description: s.description, notes: s.notes, section: s.section };

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={s.title} intro={s.intro} />

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <label>
          <span className={labelClass}>{s.language}</span>
          <select name="lang" defaultValue={target} className={fieldClass("mt-1 w-auto")}>
            {LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {s.show}
        </Button>
      </form>

      {params.failed && (
        <Notice tone="warning" role="alert" className="mt-6">
          {s.failed}
        </Notice>
      )}

      {confirmed.length === 0 ? (
        <p className="mt-8 text-muted">{s.confirmFirst}</p>
      ) : dishes.length === 0 ? (
        <p className="mt-8 text-muted">{s.allOriginal}</p>
      ) : (
        dishes.map((dish) => {
          const row = saved.get(dish.id);
          // A translation of the dish's old text no longer applies.
          const current = row && row.source_hash === translationHash(dish) ? row : undefined;
          const options = optionLabels(dish);
          return (
            <form
              key={dish.id}
              id={`dish-${dish.id}`}
              action={saveTranslationAction}
              className={panelClass}
            >
              <input type="hidden" name="dish" value={dish.id} />
              <input type="hidden" name="lang" value={target} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-2xl tracking-tight">{dish.name}</h2>
                <span className="text-xs font-medium text-muted">
                  {!current ? s.notYet : current.edited_at ? s.edited : ""}
                </span>
              </div>
              {params.saved === dish.id && (
                <Notice tone="success" role="status" className="mt-4">
                  {s.saved}
                </Notice>
              )}
              {params.incomplete === dish.id && (
                <Notice tone="warning" role="alert" className="mt-4">
                  {s.incomplete}
                </Notice>
              )}
              <div className="mt-4 space-y-4" lang={htmlLang(target)} dir={textDirection(target)}>
                {FIELDS.map((field) => {
                  const original = (dish[field] ?? "").trim();
                  if (!original) return null;
                  const long = field === "description" || field === "notes";
                  const Input = long ? "textarea" : "input";
                  return (
                    <label key={field} className="block">
                      <span className={labelClass}>{label[field]}</span>
                      <span className="mt-0.5 block text-xs text-muted" dir="auto">
                        {s.original}: {original}
                      </span>
                      <Input
                        name={field}
                        required
                        defaultValue={current?.[field] ?? ""}
                        maxLength={field === "section" ? 80 : 2000}
                        rows={long ? 3 : undefined}
                        className={fieldClass("mt-1")}
                      />
                    </label>
                  );
                })}
                {options.map((option, index) => (
                  <label key={index} className="block">
                    <span className={labelClass}>{fmt(s.option, { number: index + 1 })}</span>
                    <span className="mt-0.5 block text-xs text-muted" dir="auto">
                      {s.original}: {option}
                    </span>
                    <input
                      name="option"
                      required
                      maxLength={60}
                      defaultValue={current?.options[index] ?? ""}
                      className={fieldClass("mt-1")}
                    />
                  </label>
                ))}
              </div>
              <Button type="submit" size="sm" className="mt-5">
                {s.save}
              </Button>
            </form>
          );
        })
      )}
    </main>
  );
}
