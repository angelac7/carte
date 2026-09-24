"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Turns off movement for anyone whose device asks for reduced motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
