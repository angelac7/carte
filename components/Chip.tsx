const TONES = {
  allergen: "bg-saffron-soft text-saffron-ink",
  tag: "bg-basil-soft text-basil",
} as const;

type ChipProps = { label: string; tone: keyof typeof TONES };

/** A small read-only label for an allergen or dietary tag. */
export function Chip({ label, tone }: ChipProps) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${TONES[tone]}`}>{label}</span>;
}
