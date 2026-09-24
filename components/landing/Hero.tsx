"use client";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { MenuDemo } from "@/components/landing/MenuDemo";
import { BlurFade } from "@/components/motion/BlurFade";
import { WordRotate } from "@/components/motion/WordRotate";
import { ButtonLink } from "@/components/ui/button";

const HERO_FALLBACK =
  "radial-gradient(circle at 20% 30%, #3a4d63, transparent 50%), radial-gradient(circle at 85% 70%, #7a5000, transparent 45%), #111b26";

const LANGUAGE_PHRASES = [
  "in Korean.",
  "en español.",
  "日本語で。",
  "en français.",
  "bằng tiếng Việt.",
  "用中文。",
  "in English.",
];

type HeroProps = { image: string | null; video: string | null };

/** Full-screen opening section: cinematic background and the live menu card. */
export function Hero({ image, video }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[calc(100svh-3.5rem)] snap-start items-center overflow-hidden bg-ink text-white"
    >
      <div className="absolute inset-0 -z-20">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
        )}
        {video && (
          <video
            className="ken-burns absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            poster={image ?? undefined}
          >
            <source src={video} type="video/mp4" />
          </video>
        )}
        {!image && !video && (
          <div className="absolute inset-0" style={{ background: HERO_FALLBACK }} />
        )}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/25"
      />

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.15fr_1fr]"
      >
        <div>
          <BlurFade>
            <h1 className="font-serif text-[clamp(3rem,8vw,6.5rem)] leading-[0.95] tracking-tight">
              Every menu, understood.
            </h1>
          </BlurFade>
          <BlurFade delay={0.15}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              Allergens confirmed by the kitchen. Every dish explained. The whole menu,{" "}
              <WordRotate words={LANGUAGE_PHRASES} className="text-white" />
            </p>
          </BlurFade>
          <BlurFade delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink
                href="/discover"
                size="lg"
                shine
                className="bg-white text-ink hover:bg-white/90"
              >
                Find somewhere to eat
              </ButtonLink>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="secondary"
                className="border-white/30 bg-white/10 text-white backdrop-blur hover:border-white/60"
              >
                Put your menu on Carte
              </ButtonLink>
            </div>
          </BlurFade>
        </div>
        <BlurFade delay={0.2}>
          <MenuDemo />
        </BlurFade>
      </motion.div>
    </section>
  );
}
