import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONES = {
  /** Safety reminders, like "always tell your server about allergies". */
  caution: "border-saffron/40 bg-saffron-soft text-saffron-ink",
  /** Unconfirmed information, like a scanned paper menu. */
  warning: "border-tomato/40 bg-tomato/10 text-tomato",
  /** Owner-facing confirmations, like "Saved to your menu". Never for diner allergy safety. */
  success: "border-basil/30 bg-basil-soft text-basil",
} as const;

type NoticeProps = {
  children: ReactNode;
  tone?: keyof typeof TONES;
  /** "alert" for errors and "status" for confirmations, so screen readers announce them. */
  role?: "note" | "alert" | "status";
  className?: string;
};

/** A boxed note that stays in view. Never animated, so safety text is always readable. */
export function Notice({ children, tone = "caution", role = "note", className }: NoticeProps) {
  return (
    <p
      role={role}
      className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", TONES[tone], className)}
    >
      {children}
    </p>
  );
}
