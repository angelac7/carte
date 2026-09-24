import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { PublicHeader } from "@/components/PublicHeader";
import { ScanMenu } from "@/components/ScanMenu";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan a menu | Carte" };

export default async function ScanPage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader((await headers()).get("accept-language") ?? "");

  return (
    <>
      <PublicHeader />
      <ScanMenu
        language={language}
        initialPrefs={parsePrefs(cookieStore.get(PREFS_COOKIE)?.value)}
      />
    </>
  );
}
