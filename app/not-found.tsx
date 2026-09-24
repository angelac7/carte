import { DotPattern } from "@/components/motion/DotPattern";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden px-5">
      <DotPattern className="-z-10 [mask-image:radial-gradient(circle,white,transparent_70%)]" />
      <div className="max-w-md text-center">
        <p className="font-serif text-8xl text-line">404</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight">This page isn’t on the menu</h1>
        <p className="mt-3 leading-relaxed text-muted">
          The link may be old, or the restaurant may have changed its menu link.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
