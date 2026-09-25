import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { MyCarte } from "@/components/MyCarte";
import { PageHero } from "@/components/PageHero";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  languageFromAcceptHeader,
  textDirection,
} from "@/lib/languages";
import { publicAsset } from "@/lib/public-asset";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Carte | Carte" };

export default async function MyCartePage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader((await headers()).get("accept-language") ?? "");
  const t = MY_CARTE_STRINGS[language];

  return (
    <>
      <PublicHeader />
      <PageHero
        title={t.myCarte}
        intro={t.intro}
        image={publicAsset("images/my.jpg")}
        lang={htmlLang(language)}
        dir={textDirection(language)}
        narrow
      >
        <p className="text-sm text-white/70">{t.offlineNote}</p>
      </PageHero>
      <MyCarte
        language={language}
        initialPrefs={parsePrefs(cookieStore.get(PREFS_COOKIE)?.value)}
      />
      <SiteFooter />
    </>
  );
}
