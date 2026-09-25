"use client";
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { z } from "zod";
import { DinerMenu } from "@/components/DinerMenu";
import { Notice } from "@/components/ui/notice";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { MenuItemSchema } from "@/types/menu";
const Reply = z.object({ dishes: z.array(MenuItemSchema.refine((dish) => dish.confirmed)) });
type Props = ComponentProps<typeof DinerMenu>;
function fingerprint(dishes: Props["dishes"]) {
  return JSON.stringify(
    dishes.map((d) => [
      d.id,
      d.revision,
      d.name,
      d.description,
      d.notes,
      d.price,
      d.confirmed,
      d.allergens,
      d.dietary_tags,
      d.photo_url,
      d.source_language,
      d.section,
      d.sort_order,
    ]),
  );
}
/** Refresh confirmed data while visible; reset stale order, translations and AI panels on change. */
export function LiveDinerMenu(props: Props) {
  const [current, setCurrent] = useState(props);
  const currentRef = useRef(props);
  const rememberPreferences = useCallback(
    (preferences: Pick<Props, "initialLanguage" | "initialPrefs" | "initialDisplay">) => {
      currentRef.current = { ...currentRef.current, ...preferences };
    },
    [],
  );
  const [generation, setGeneration] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let pending = false;
    let controller: AbortController | null = null;
    async function refresh() {
      if (pending || document.visibilityState === "hidden" || !navigator.onLine) return;
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch(
          `/api/menu?restaurant=${encodeURIComponent(props.restaurant.slug)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const reply =
          response.status === 404
            ? { dishes: [] }
            : response.ok
              ? Reply.parse(await response.json())
              : null;
        if (!reply) throw new Error("Refresh unavailable");
        if (!active) return;
        setFailed(false);
        if (fingerprint(reply.dishes) !== fingerprint(currentRef.current.dishes)) {
          const next = { ...currentRef.current, dishes: reply.dishes };
          currentRef.current = next;
          setCurrent(next);
          setGeneration((value) => value + 1);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        clearTimeout(timeout);
        pending = false;
      }
    }
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(interval);
      controller?.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [props.restaurant.slug]);
  const t = DINER_STRINGS[current.initialLanguage];
  return (
    <>
      {generation > 0 && (
        <Notice tone="warning" role="status" className="mx-auto mt-4 max-w-3xl">
          {t.menuUpdated}
        </Notice>
      )}
      {failed && (
        <Notice tone="warning" role="alert" className="mx-auto mt-4 max-w-3xl">
          {t.refreshFailed}
        </Notice>
      )}
      <DinerMenu key={generation} {...current} onPreferencesChange={rememberPreferences} />
    </>
  );
}
