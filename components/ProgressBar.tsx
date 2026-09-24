type ProgressBarProps = { done: number; total: number };

/** Shows how many dishes have been confirmed. */
export function ProgressBar({ done, total }: ProgressBarProps) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">
          {done} of {total} confirmed
        </span>
        <span className="tabular-nums text-muted">{percent}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Dishes confirmed"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-basil transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
