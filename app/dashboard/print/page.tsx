import type { Metadata } from "next";
import QRCode from "qrcode";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { PrintableMenu } from "@/components/owner/PrintableMenu";
import { TranslateForPrint } from "@/components/owner/TranslateForPrint";
import { PrintButton } from "@/components/PrintButton";
import { Notice } from "@/components/ui/notice";
import { fieldClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requireRestaurant } from "@/lib/auth";
import { getConfirmedDishes } from "@/lib/db";
import { getCachedTranslations } from "@/lib/db/translations";
import { htmlLang, isLanguageCode, LANGUAGES, type LanguageCode } from "@/lib/languages";
import { siteUrl } from "@/lib/site-url";
import type { MenuTranslations } from "@/types/translation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Printed menu | Carte" };

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/print");
  const dishes = await getConfirmedDishes(supabase, restaurant.id);
  const source = dishes.find((dish) => dish.source_language && isLanguageCode(dish.source_language))
    ?.source_language as LanguageCode | undefined;
  const requested = (await searchParams).lang ?? "";
  const language: LanguageCode = isLanguageCode(requested) ? requested : (source ?? "en");

  // Dish text comes from saved translations; anything missing prints in its original language.
  let translations: MenuTranslations = {};
  let missing = 0;
  if (dishes.some((dish) => (dish.source_language ?? "en") !== language)) {
    const cached = await getCachedTranslations(language, dishes).catch(() => null);
    translations = cached?.found ?? {};
    missing = cached ? cached.missing.length : dishes.length;
  }

  const menuUrl = `${siteUrl()}/r/${restaurant.slug}`;
  const qrSrc = `data:image/svg+xml;utf8,${encodeURIComponent(
    await QRCode.toString(menuUrl, {
      type: "svg",
      margin: 1,
      color: { dark: "#0a0c10", light: "#ffffff" },
    }),
  )}`;
  const printedOn = new Intl.DateTimeFormat(htmlLang(language), { dateStyle: "long" }).format(
    new Date(),
  );

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12 print:max-w-none print:p-0">
      <div className="print:hidden">
        <OwnerPageHeader
          title="Printed menu"
          intro="A paper menu of your confirmed dishes with their allergens, in any of Carte's languages. Print it or save it as a PDF."
        />
        <form className="mt-8 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="eyebrow text-muted">Language</span>
            <select name="lang" defaultValue={language} className={fieldClass("mt-1 w-auto")}>
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            Show
          </Button>
          <PrintButton label="Print or save as PDF" />
        </form>
        {dishes.length === 0 && (
          <Notice className="mt-6">
            Confirm some dishes first. Only confirmed dishes are printed.
          </Notice>
        )}
        {missing > 0 && (
          <Notice className="mt-6">
            {missing === 1 ? "1 dish isn't" : `${missing} dishes aren't`} translated yet, so{" "}
            {missing === 1 ? "it prints" : "they print"} in the original language.
            <span className="mt-3 block">
              <TranslateForPrint slug={restaurant.slug} language={language} />
            </span>
          </Notice>
        )}
      </div>

      {dishes.length > 0 && (
        <div className="mt-8 print:mt-0">
          <PrintableMenu
            restaurantName={restaurant.name}
            dishes={dishes}
            language={language}
            translations={translations}
            qrSrc={qrSrc}
            menuUrl={menuUrl}
            printedOn={printedOn}
          />
        </div>
      )}
    </main>
  );
}
