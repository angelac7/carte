import Image from "next/image";
import type { ReactNode } from "react";
import { BlurFade } from "@/components/motion/BlurFade";
import { DotPattern } from "@/components/motion/DotPattern";
import { cn } from "@/lib/cn";

const FALLBACK =
  "radial-gradient(circle at 15% 20%, #3a4d63, transparent 50%), radial-gradient(circle at 90% 90%, #7a5000, transparent 45%), #111b26";

type PageHeroProps = {
  title: string;
  intro?: string;
  image?: string | null;
  lang?: string;
  /** Line up with a narrow (max-w-3xl) page body instead of the wide default. */
  narrow?: boolean;
  children?: ReactNode;
};

/** A cinematic page header: large type over a slowly zooming photo, or a designed gradient. */
export function PageHero({ title, intro, image, lang, narrow = false, children }: PageHeroProps) {
  return (
    <header lang={lang} className="relative isolate overflow-hidden bg-ink text-white">
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="ken-burns -z-20 object-cover"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-20" style={{ background: FALLBACK }}>
          <DotPattern className="text-white/10" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30"
      />
      <div className={cn("mx-auto px-5 pt-20 pb-20 sm:pt-28", narrow ? "max-w-3xl" : "max-w-5xl")}>
        <BlurFade>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-balance break-words sm:text-7xl">
            {title}
          </h1>
        </BlurFade>
        {intro && (
          <BlurFade delay={0.1}>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{intro}</p>
          </BlurFade>
        )}
        {children && (
          <BlurFade delay={0.2}>
            <div className="mt-6">{children}</div>
          </BlurFade>
        )}
      </div>
    </header>
  );
}
