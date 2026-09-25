"use client";
import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";

type MenuHeroProps = {
  name: string;
  /** Short facts under the name, like the cuisine and city. */
  details: string[];
  cover: string | null;
  /** A line under the rule, like "Menu · 10 dishes". */
  summary: string;
  /** Controls along the top: language, text size, save. */
  controls: ReactNode;
  /** A link along the top left, like My Carte. */
  lead?: ReactNode;
};

/** The restaurant's name set large, over a slowly zooming dish photo or fine ink texture. */
export function MenuHero({ name, details, cover, summary, controls, lead }: MenuHeroProps) {
  return (
    <header className="texture-ink relative isolate overflow-hidden text-white">
      {cover && (
        <>
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="ken-burns -z-20 object-cover opacity-70"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/25"
          />
        </>
      )}
      <div className="mx-auto max-w-5xl px-5 pt-5 pb-12 sm:pb-16">
        <div className="flex items-center justify-between gap-2">
          <div>{lead}</div>
          <div className="flex items-center gap-2">{controls}</div>
        </div>
        <div className="mt-16 sm:mt-24">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-[clamp(3.75rem,19vw,10rem)] leading-[0.85] tracking-tighter text-balance break-words"
          >
            {name}
          </motion.h1>
          {details.length > 0 && (
            <p className="mt-5 text-2xl leading-snug text-white/85 sm:text-3xl">
              {details.join(" · ")}
            </p>
          )}
          <div aria-hidden="true" className="mt-7 h-1 w-20 bg-white" />
          <p className="eyebrow mt-5 text-white/60">{summary}</p>
        </div>
      </div>
    </header>
  );
}
