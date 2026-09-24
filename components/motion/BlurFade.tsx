"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type BlurFadeProps = { children: ReactNode; delay?: number; className?: string };

/** Content that fades and sharpens into view as it scrolls onto the screen. */
export function BlurFade({ children, delay = 0, className }: BlurFadeProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
