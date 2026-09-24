"use client";
import { motion } from "motion/react";
import type { DailyViews } from "@/lib/db/owner-stats";

/** Daily dish views as bars that grow into place. Hover a bar to see its count. */
export function ViewsChart({ days }: { days: DailyViews[] }) {
  const max = Math.max(1, ...days.map((day) => day.views));
  const total = days.reduce((sum, day) => sum + day.views, 0);

  return (
    <div>
      <div
        className="flex h-36 items-end gap-1.5"
        role="img"
        aria-label={`Dish views over the last ${days.length} days: ${total} in total`}
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
              className="w-full rounded-t-md bg-basil/70 transition-colors group-hover:bg-basil"
            />
            <span className="pointer-events-none absolute -top-7 rounded bg-ink px-1.5 py-0.5 text-[11px] text-white tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
              {day.views}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{days.length} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
