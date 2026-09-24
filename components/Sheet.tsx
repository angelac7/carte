"use client";
import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

/** A panel that slides up on phones and floats in the middle on larger screens. */
export function Sheet({ title, closeLabel, onClose, children }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 sm:items-center print:hidden"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="shrink-0 text-sm text-muted hover:text-ink"
          >
            {closeLabel}
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
