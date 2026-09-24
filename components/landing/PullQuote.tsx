import { BlurFade } from "@/components/motion/BlurFade";

/** An editorial pull quote: large italic serif under an oversized quotation mark. */
export function PullQuote({ quote, caption }: { quote: string; caption: string }) {
  return (
    <section className="snap-start border-y-4 border-ink px-5 py-24 sm:py-32">
      <figure className="relative mx-auto max-w-5xl">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 -left-1 font-serif text-[9rem] leading-none text-accent/25 select-none sm:-top-24 sm:-left-6 sm:text-[16rem]"
        >
          “
        </span>
        <BlurFade>
          <blockquote className="relative font-serif text-4xl leading-[1.05] tracking-tight italic sm:text-6xl lg:text-7xl">
            {quote}
          </blockquote>
        </BlurFade>
        <figcaption className="eyebrow mt-10 flex items-center gap-3 text-muted">
          <span aria-hidden="true" className="h-px w-12 bg-ink" />
          {caption}
        </figcaption>
      </figure>
    </section>
  );
}
