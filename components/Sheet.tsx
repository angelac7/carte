"use client";
import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type SheetProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** A full-width photo above the title. */
  media?: ReactNode;
  /** Extra lines under the title, like a dish's original name. */
  subtitle?: ReactNode;
};

/** A panel that slides up on phones and floats in the middle on larger screens. */
export function Sheet({ title, closeLabel, onClose, children, media, subtitle }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center print:hidden"
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        {media && (
          <div className="relative -mx-5 -mt-5 mb-5 aspect-[16/10] overflow-hidden sm:-mx-6 sm:-mt-6">
            {media}
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl leading-tight">{title}</h2>
            {subtitle}
          </div>
          <Button
            ref={closeRef}
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="-mt-1 -mr-2 shrink-0"
          >
            {closeLabel}
          </Button>
        </div>
        {children}
      </motion.section>
    </motion.div>
  );
}
