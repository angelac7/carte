import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { PageHero } from "@/components/PageHero";
import { PublicHeader } from "@/components/PublicHeader";
import { ScanMenu } from "@/components/ScanMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { CAMERA_STRINGS } from "@/lib/i18n/camera-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  languageFromAcceptHeader,
} from "@/lib/languages";
import { publicAsset } from "@/lib/public-asset";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan a menu | Carte" };

export default async function ScanPage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader((await headers()).get("accept-language") ?? "");
  const t = CAMERA_STRINGS[language];

  return (
    <>
      <PublicHeader />
      <PageHero
        title={t.scanTitle}
        intro={t.scanIntro}
        image={publicAsset("images/scan.jpg")}
        lang={htmlLang(language)}
        narrow
      />
      <ScanMenu
        language={language}
        initialPrefs={parsePrefs(cookieStore.get(PREFS_COOKIE)?.value)}
      />
      <SiteFooter />
    </>
  );
}
