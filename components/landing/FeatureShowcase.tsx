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

const number = (index: number) => String(index + 1).padStart(2, "0");

/** A feature's number and title set large, shown when there's no photo for it yet. */
function FeaturePlate({ feature, index }: { feature: Feature; index: number }) {
  return (
    <span className="block text-center">
      <span className="block font-serif text-[7rem] leading-none tracking-tighter text-accent italic">
        {number(index)}
      </span>
      <span className="mx-auto mt-4 block max-w-xs font-serif text-2xl leading-tight">
        {feature.title}
      </span>
    </span>
  );
}

/** Hover or tap a feature: its text slides over, its description opens, and its plate fades in. */
export function FeatureShowcase({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ul className="border-t border-ink">
        {features.map((feature, index) => {
          const isActive = index === active;
          return (
            <li key={feature.id} className="border-b border-ink/15">
              <button
                type="button"
                aria-expanded={isActive}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className="flex w-full items-start gap-5 py-6 text-left"
              >
                <span
                  className={cn(
                    "eyebrow pt-2 transition-colors",
                    isActive ? "text-accent" : "text-muted",
                  )}
                >
                  {number(index)}
                </span>
                <motion.span animate={{ x: isActive ? 8 : 0 }} className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-serif text-2xl leading-tight tracking-tight transition-colors sm:text-4xl",
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
                          className="mt-5 block aspect-[4/3] rounded-panel lg:hidden"
                          placeholder={<FeaturePlate feature={feature} index={index} />}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -8 }}
                  className="pt-2 text-2xl text-accent"
                >
                  →
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative hidden aspect-[4/5] rounded-panel bg-paper p-4 shadow-raised lg:sticky lg:top-24 lg:block">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-4"
          >
            <MediaFrame
              src={current.image}
              alt={current.imageAlt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full rounded-[1.5rem]"
              placeholder={<FeaturePlate feature={current} index={active} />}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
