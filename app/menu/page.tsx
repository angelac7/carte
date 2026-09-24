import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { DinerMenu } from "@/components/DinerMenu";
import { readItems } from "@/lib/db";
import { isLanguageCode, LANGUAGE_COOKIE, languageFromAcceptHeader } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";

// Read fresh data on every visit so owner changes show up right away.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Menu | Carte" };

export default async function MenuPage() {
  // Use the diner's saved choice, or else their phone's language.
  const saved = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const initialLanguage =
    saved && isLanguageCode(saved) ? saved : languageFromAcceptHeader(acceptLanguage);

  // Filtering happens on the server, so unconfirmed dishes never reach a diner's browser.
  return <DinerMenu dishes={confirmedOnly(readItems())} initialLanguage={initialLanguage} />;
}
