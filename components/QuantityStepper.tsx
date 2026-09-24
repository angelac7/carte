"use client";

type StepperLabels = { add: string; increase: string; decrease: string };

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  labels: StepperLabels;
};

const MAX_QUANTITY = 20;

/** Shows "Add" until a dish is in the order, then minus and plus buttons. */
export function QuantityStepper({ quantity, onChange, labels }: QuantityStepperProps) {
  if (quantity === 0) {
    return (
      <button
        onClick={() => onChange(1)}
        className="rounded-full border border-ink px-4 py-1 text-sm font-medium hover:bg-ink hover:text-white"
      >
        {labels.add}
      </button>
    );
  }

  const stepClass =
    "h-8 w-8 rounded-full border border-line text-lg leading-none hover:border-muted";
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={labels.decrease}
        onClick={() => onChange(quantity - 1)}
        className={stepClass}
      >
        −
      </button>
      <span className="w-5 text-center tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        aria-label={labels.increase}
        onClick={() => onChange(Math.min(quantity + 1, MAX_QUANTITY))}
        className={stepClass}
      >
        +
      </button>
    </div>
  );
}
