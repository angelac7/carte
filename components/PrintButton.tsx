"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
    >
      {label}
    </button>
  );
}
