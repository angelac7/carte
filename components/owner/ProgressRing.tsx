"use client";
import { motion } from "motion/react";

/** A ring that fills as setup steps are completed. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const progress = total ? done / total : 0;
  return (
    <div
      className="relative h-24 w-24 shrink-0 rounded-full shadow-raised-sm"
      role="img"
      aria-label={`${done} of ${total} steps done`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}
