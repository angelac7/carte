"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MediaFrame } from "@/components/landing/MediaFrame";
import { cn } from "@/lib/cn";

export type Feature = {
  id: string;
  title: string;
  body: string;
  image: string | null;
  imageAlt: string;
};

/** Hover or tap a feature: its text slides over, its description opens, and its photo fades in. */
export function FeatureShowcase({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ul>
        {features.map((feature, index) => {
          const isActive = index === active;
          return (
            <li key={feature.id} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isActive}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className="flex w-full items-start gap-4 py-6 text-left"
              >
                <motion.span animate={{ x: isActive ? 12 : 0 }} className="flex-1">
                  <span
                    className={cn(
                      "block font-serif text-3xl leading-tight transition-colors sm:text-4xl",
                      isActive ? "text-ink" : "text-muted",
                    )}
                  >
                    {feature.title}
                  </span>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="block overflow-hidden"
                      >
                        <span className="block max-w-md pt-3 leading-relaxed text-muted">
                          {feature.body}
                        </span>
                        <MediaFrame
                          src={feature.image}
                          alt={feature.imageAlt}
                          sizes="100vw"
                          className="mt-4 block aspect-[4/3] rounded-xl lg:hidden"
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -8 }}
                  className="pt-2 text-2xl"
                >
                  →
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl shadow-xl lg:sticky lg:top-24 lg:block">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <MediaFrame
              src={current.image}
              alt={current.imageAlt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full"
              tone={active % 2 === 0 ? "warm" : "basil"}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
