import type { ReactNode } from "react";
import { OwnerLanguageProvider } from "@/components/owner/OwnerLanguage";
import { PublicHeader } from "@/components/PublicHeader";
import { htmlLang, textDirection } from "@/lib/languages";
import { ownerStrings } from "@/lib/owner-language";

/**
 * Pages for owners outside the dashboard, like login: the header and page in the owner's
 * dashboard language, or their browser's.
 */
export async function OwnerTextPage({ children }: { children: ReactNode }) {
  const { t, language } = await ownerStrings();
  return (
    <div lang={htmlLang(language)} dir={textDirection(language)}>
      <PublicHeader language={language} />
      <OwnerLanguageProvider strings={t} language={language}>
        {children}
      </OwnerLanguageProvider>
    </div>
  );
}
