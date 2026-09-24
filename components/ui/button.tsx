import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// Raised from the clay surface; lifts on hover and presses in when tapped.
const RAISED = "shadow-raised-sm hover:-translate-y-px hover:shadow-raised active:translate-y-px";

const VARIANTS = {
  primary: cn("bg-accent text-white active:shadow-pressed-color", RAISED),
  secondary: cn("bg-paper text-ink active:shadow-pressed-sm", RAISED),
  basil: cn("bg-basil text-white active:shadow-pressed-color", RAISED),
  /** Editorial black, for emphasis without the accent. */
  ink: cn("bg-ink text-white active:shadow-pressed-color", RAISED),
  ghost: "text-muted underline-offset-4 hover:text-ink hover:underline",
  danger: "text-muted underline-offset-4 hover:text-tomato hover:underline",
  /** Primary action on a dark or photo background. */
  inverse: "bg-paper text-ink hover:-translate-y-px hover:bg-white active:translate-y-px",
  /** Secondary action on a dark or photo background. */
  glass: "border border-white/30 bg-white/10 text-white backdrop-blur hover:border-white/60",
} as const;

const SIZES = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const;

type ButtonStyle = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** A light sweep across the button on hover, for the main call to action. */
  shine?: boolean;
};

export function buttonClass({ variant = "primary", size = "md", shine = false }: ButtonStyle = {}) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-control font-semibold",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    shine && "shine",
  );
}

/** Extra classes for a <label> styled as a button that wraps a hidden file input. */
export const fileButtonClass =
  "cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-accent has-disabled:pointer-events-none has-disabled:opacity-50";

export function Button({
  variant,
  size,
  shine,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return <button className={cn(buttonClass({ variant, size, shine }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  shine,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={cn(buttonClass({ variant, size, shine }), className)} {...props} />;
}
