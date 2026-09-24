"use client";
import { toast } from "sonner";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import { updateMyCarte } from "@/lib/my-carte-store";
import type { MyCarte } from "@/lib/my-carte";

export function useMyCarteWriter(language: LanguageCode) {
  return (change: (current: MyCarte) => MyCarte): boolean => {
    const saved = updateMyCarte(change);
    if (!saved) toast.error(MY_CARTE_STRINGS[language].storageFailed);
    return saved;
  };
}
