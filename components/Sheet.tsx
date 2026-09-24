"use client";
import { motion, useDragControls } from "motion/react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { shouldDismissSheet } from "@/lib/sheet-gesture";

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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A panel that slides up on phones and floats in the middle on larger screens.
 * On phones it can be pulled down by its handle to close. While open, the page behind
 * doesn't scroll and keyboard focus stays inside; closing returns focus where it was.
 */
export function Sheet({ title, closeLabel, onClose, children, media, subtitle }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center print:hidden"
      onClick={onClose}
    >
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (shouldDismissSheet(info.offset.y, info.velocity.y)) onClose();
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-panel bg-paper px-6 pt-3 pb-8 shadow-raised-lg sm:max-w-lg sm:rounded-panel sm:p-8"
      >
        {/* Pull-down handle on phones. */}
        <div
          aria-hidden="true"
          onPointerDown={(event) => dragControls.start(event)}
          className="-mx-6 mb-3 flex cursor-grab touch-none justify-center py-2 active:cursor-grabbing sm:hidden"
        >
          <span className="h-1.5 w-12 rounded-full bg-line shadow-pressed-sm" />
        </div>
        {media && (
          <div className="relative -mx-3 mb-6 aspect-[16/10] overflow-hidden rounded-[1.5rem] sm:-mx-5 sm:-mt-5">
            {media}
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-3xl leading-tight tracking-tight">{title}</h2>
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
