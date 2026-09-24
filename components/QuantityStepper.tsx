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
        className="rounded-full bg-paper px-5 py-2.5 text-sm font-semibold shadow-raised-sm transition-[box-shadow,color,transform] duration-200 ease-out hover:-translate-y-px hover:text-accent active:translate-y-px active:shadow-pressed-sm"
      >
        {labels.add}
      </button>
    );
  }

  const stepClass =
    "h-11 w-11 rounded-full bg-paper text-lg leading-none shadow-raised-sm transition-[box-shadow,color] duration-200 hover:text-accent active:shadow-pressed-sm";
  return (
    <div className="flex items-center gap-1 rounded-full p-1 shadow-pressed-sm">
      <button
        aria-label={labels.decrease}
        onClick={() => onChange(quantity - 1)}
        className={stepClass}
      >
        −
      </button>
      <span className="w-7 text-center font-mono text-sm tabular-nums" aria-live="polite">
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
