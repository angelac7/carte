"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MediaFrame } from "@/components/landing/MediaFrame";
import { BlurFade } from "@/components/motion/BlurFade";

/** A full-width photo that moves slower than the page, with a statement over it. */
export function ParallaxBand({ image }: { image: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section ref={ref} className="relative h-[75svh] snap-start overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[12%]">
        <MediaFrame
          src={image}
          alt="A chef plating a dish"
          sizes="100vw"
          className="h-full w-full"
          tone="ink"
        />
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent"
      />
      <div className="relative mx-auto flex h-full max-w-6xl items-end px-5 pb-16">
        <BlurFade>
          <p className="max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">
            Allergies aren’t an afterthought. They’re the first thing on the menu.
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
