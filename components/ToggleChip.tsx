const PRESSED = {
  ink: "bg-ink text-white shadow-pressed-color",
  basil: "bg-basil text-white shadow-pressed-color",
} as const;

type ToggleChipProps = {
  label: string;
  pressed: boolean;
  tone: keyof typeof PRESSED;
  onToggle: () => void;
};

/**
 * A pill button that switches on and off, used for allergens and tags.
 * Off is raised from the clay; on is filled and pressed in, so the state never relies on shadow alone.
 */
export function ToggleChip({ label, pressed, tone, onToggle }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-[box-shadow,background-color,color,transform] duration-200 ease-out active:translate-y-px ${
        pressed ? PRESSED[tone] : "bg-paper text-muted shadow-raised-sm hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
