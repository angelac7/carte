import { cn } from "@/lib/cn";

/** A shimmering placeholder shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden="true" />;
}

/** A page-shaped placeholder: a title, an intro line, and a list of cards. */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <div className="mt-10 space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="rounded-lg border border-line bg-card p-5">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-3 h-4 w-5/6" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
