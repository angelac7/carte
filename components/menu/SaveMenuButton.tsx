"use client";
import { HeartIcon } from "@/components/icons";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import type { LanguageCode } from "@/lib/languages";
import { isRestaurantSaved, toggleSavedRestaurant } from "@/lib/my-carte";
import { useMyCarte } from "@/lib/my-carte-store";
import { useMyCarteWriter } from "@/lib/use-my-carte-writer";
import { cn } from "@/lib/cn";

type SaveMenuButtonProps = {
  restaurant: { name: string; slug: string; cuisine: string };
  language: LanguageCode;
};

/** Saves this restaurant's menu to My Carte on this device. */
export function SaveMenuButton({ restaurant, language }: SaveMenuButtonProps) {
  const t = MY_CARTE_STRINGS[language];
  const saveOnDevice = useMyCarteWriter(language);
  const saved = isRestaurantSaved(useMyCarte(), restaurant.slug);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() =>
        saveOnDevice((current) => toggleSavedRestaurant(current, restaurant, Date.now()))
      }
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium backdrop-blur transition-colors",
        saved
          ? "border-white bg-white text-ink"
          : "border-white/30 bg-white/10 text-white hover:border-white/60",
      )}
    >
      <span className={cn("h-5 w-5", saved && "[&_path]:fill-current")}>
        <HeartIcon />
      </span>
      <span className="hidden sm:inline">{saved ? t.menuSaved : t.saveMenu}</span>
      <span className="sr-only sm:hidden">{saved ? t.menuSaved : t.saveMenu}</span>
    </button>
  );
}
