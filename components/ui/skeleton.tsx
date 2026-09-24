import { cn } from "@/lib/cn";

/** A shimmering placeholder shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden="true" />;
}

type PageSkeletonProps = {
  rows?: number;
  /** Match pages that open with a dark PageHero, so the layout doesn't jump when they load. */
  hero?: boolean;
  /** With `hero`, use the narrow page width. */
  narrow?: boolean;
};

/** A page-shaped placeholder: a title, an intro line, and a list of cards. */
export function PageSkeleton({ rows = 4, hero = false, narrow = false }: PageSkeletonProps) {
  const width = narrow ? "max-w-3xl" : "max-w-5xl";
  const cards = Array.from({ length: rows }, (_, index) => (
    <div key={index} className="rounded-panel bg-paper p-6 shadow-raised">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-3 h-4 w-5/6" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  ));

  if (hero) {
    return (
      <main aria-busy="true" aria-label="Loading">
        <div className="texture-ink">
          <div className={cn("mx-auto px-5 pt-20 pb-20 sm:pt-28", width)}>
            <div className="h-12 w-2/3 rounded-md bg-white/10 sm:h-16" />
            <div className="mt-5 h-4 w-full max-w-md rounded-md bg-white/10" />
          </div>
        </div>
        <div className={cn("mx-auto space-y-4 px-5 py-10", width)}>{cards}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <div className="mt-10 space-y-4">{cards}</div>
    </main>
  );
}
