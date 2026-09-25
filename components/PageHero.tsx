import Image from "next/image";
import type { ReactNode } from "react";
import { BlurFade } from "@/components/motion/BlurFade";
import { cn } from "@/lib/cn";

type PageHeroProps = {
  title: string;
  intro?: string;
  image?: string | null;
  lang?: string;
  /** "rtl" for right-to-left languages like Arabic. */
  dir?: "rtl" | "ltr";
  /** Line up with a narrow (max-w-3xl) page body instead of the wide default. */
  narrow?: boolean;
  children?: ReactNode;
};

/** An inverted ink page header: oversized serif type over a slowly zooming photo or fine ink texture. */
export function PageHero({
  title,
  intro,
  image,
  lang,
  dir,
  narrow = false,
  children,
}: PageHeroProps) {
  return (
    <header
      lang={lang}
      dir={dir}
      className="texture-ink relative isolate overflow-hidden text-white"
    >
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="ken-burns -z-20 object-cover opacity-60 grayscale-[35%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/35"
          />
        </>
      )}
      <div
        className={cn(
          "mx-auto px-5 pt-20 pb-24 sm:pt-28 sm:pb-28",
          narrow ? "max-w-3xl" : "max-w-5xl",
        )}
      >
        <BlurFade>
          <h1 className="font-serif text-[clamp(3rem,11vw,6.5rem)] leading-[0.92] tracking-tighter text-balance break-words">
            {title}
          </h1>
        </BlurFade>
        <div aria-hidden="true" className="mt-7 h-1 w-20 bg-white" />
        {intro && (
          <BlurFade delay={0.1}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">{intro}</p>
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
