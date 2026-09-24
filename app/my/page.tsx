import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { MyCarte } from "@/components/MyCarte";
import { PublicHeader } from "@/components/PublicHeader";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Carte | Carte" };

export default async function MyCartePage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader((await headers()).get("accept-language") ?? "");

  return (
    <>
      <PublicHeader />
      <MyCarte
        language={language}
        initialPrefs={parsePrefs(cookieStore.get(PREFS_COOKIE)?.value)}
      />
    </>
  );
}
