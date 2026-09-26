import { cookies, headers } from "next/headers";
import { OWNER_STRINGS, type OwnerStrings } from "@/lib/i18n/owner-strings";
import { isLanguageCode, languageFromAcceptHeader, type LanguageCode } from "@/lib/languages";

// Server code only: it reads the request's cookies and headers.

/** The owner's chosen dashboard language, kept apart from the language they read menus in. */
export const DASHBOARD_LANGUAGE_COOKIE = "carte-dashboard-language";

/** The dashboard language: the owner's choice, or else their browser's language. */
export async function ownerLanguage(): Promise<LanguageCode> {
  try {
    const saved = (await cookies()).get(DASHBOARD_LANGUAGE_COOKIE)?.value;
    if (saved && isLanguageCode(saved)) return saved;
    return languageFromAcceptHeader((await headers()).get("accept-language") ?? "");
  } catch {
    // Outside a request, like in tests and scripts.
    return "en";
  }
}

/** The dashboard text in the owner's language, and the language itself. */
export async function ownerStrings() {
  const language = await ownerLanguage();
  return { t: OWNER_STRINGS[language], language };
}

/** A dashboard page's browser tab title, in the owner's language. */
export async function ownerTitle(pick: (t: OwnerStrings) => string) {
  const { t } = await ownerStrings();
  return { title: `${pick(t)} | Carte` };
}
