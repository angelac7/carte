import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative isolate flex min-h-[85vh] items-center justify-center overflow-hidden px-5 py-16"
    >
      <div
        aria-hidden="true"
        className="texture-grid absolute inset-0 -z-10 [mask-image:radial-gradient(circle,black,transparent_70%)]"
      />
      <div className="max-w-xl text-center">
        <p className="font-serif text-[clamp(7rem,30vw,14rem)] leading-none tracking-tighter text-accent italic">
          404
        </p>
        <div aria-hidden="true" className="mt-10 flex items-center justify-center gap-3">
          <span className="h-1 w-16 bg-ink" />
          <span className="h-2.5 w-2.5 border-2 border-ink" />
        </div>
        <h1 className="mt-8 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          This page isn’t on the menu
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          The link may be old, or the restaurant may have changed its menu link.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/" shine>
            Go home
          </ButtonLink>
          <ButtonLink href="/discover" variant="secondary">
            Discover restaurants
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
