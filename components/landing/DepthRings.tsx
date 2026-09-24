import { cn } from "@/lib/cn";

/** Decorative concentric rings, alternately raised from and pressed into the clay. */
export function DepthRings({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none animate-float", className)}>
      <div className="flex h-72 w-72 items-center justify-center rounded-full shadow-raised">
        <div className="flex h-52 w-52 items-center justify-center rounded-full shadow-well">
          <div className="flex h-32 w-32 items-center justify-center rounded-full shadow-raised">
            <div className="h-12 w-12 rounded-full bg-accent shadow-pressed-color" />
          </div>
        </div>
      </div>
    </div>
  );
}
