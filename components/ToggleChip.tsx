const PRESSED = {
  ink: "border-ink bg-ink text-white",
  basil: "border-basil bg-basil text-white",
} as const;

type ToggleChipProps = {
  label: string;
  pressed: boolean;
  tone: keyof typeof PRESSED;
  onToggle: () => void;
};

/** A pill button that switches on and off, used for allergens and tags. */
export function ToggleChip({ label, pressed, tone, onToggle }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        pressed ? PRESSED[tone] : "border-line text-muted hover:border-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
