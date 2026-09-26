"use client";
import { createContext, useContext, type ReactNode } from "react";
import { en } from "@/lib/i18n/owner/en";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";
import type { LanguageCode } from "@/lib/languages";

type OwnerText = { t: OwnerStrings; language: LanguageCode };

// English until a page says otherwise, so owner components also work on their own.
const OwnerTextContext = createContext<OwnerText>({ t: en, language: "en" });

/** Gives the dashboard's client components the owner's language, sent once from the server. */
export function OwnerLanguageProvider({
  strings,
  language,
  children,
}: {
  strings: OwnerStrings;
  language: LanguageCode;
  children: ReactNode;
}) {
  return (
    <OwnerTextContext.Provider value={{ t: strings, language }}>
      {children}
    </OwnerTextContext.Provider>
  );
}

/** The dashboard text in the owner's language. */
export function useOwnerText(): OwnerText {
  return useContext(OwnerTextContext);
}
