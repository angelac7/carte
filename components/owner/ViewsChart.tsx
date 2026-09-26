"use client";
import { motion } from "motion/react";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import type { DailyViews } from "@/lib/db/owner-stats";
import { fmt } from "@/lib/i18n/owner/format";

/** Daily dish views as bars that grow into place. Hover a bar to see its count. */
export function ViewsChart({ days }: { days: DailyViews[] }) {
  const max = Math.max(1, ...days.map((day) => day.views));
  const total = days.reduce((sum, day) => sum + day.views, 0);
  const { t } = useOwnerText();

  return (
    <div>
      <div
        className="flex h-36 items-end gap-1.5"
        role="img"
        aria-label={fmt(t.views.chartLabel, { days: days.length, total })}
      >
        {days.map((day, index) => (
          <div
            key={day.day}
            className="group relative flex h-full flex-1 flex-col items-center justify-end"
          >
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03, duration: 0.5, ease: "easeOut" }}
              style={{ height: `${Math.max(4, (day.views / max) * 100)}%`, originY: 1 }}
              className="w-full rounded-t-lg bg-accent/70 transition-colors group-hover:bg-accent"
            />
            <span className="pointer-events-none absolute -top-8 rounded-md bg-ink px-2 py-1 font-mono text-[11px] text-white tabular-nums opacity-0 shadow-raised-sm transition-opacity group-hover:opacity-100">
              {day.views}
            </span>
          </div>
        ))}
      </div>
      <div className="eyebrow mt-3 flex justify-between text-muted">
        <span>{fmt(t.views.daysAgo, { days: days.length })}</span>
        <span>{t.views.today}</span>
      </div>
    </div>
  );
}
