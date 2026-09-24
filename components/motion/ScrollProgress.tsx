"use client";
import { motion, useScroll, useSpring } from "motion/react";

/** A thin accent line along the top edge that fills as the page is read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-accent print:hidden"
    />
  );
}
