import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-ink text-white shadow-sm hover:bg-ink/90 hover:shadow-md",
  secondary: "border border-line bg-card text-ink hover:border-muted",
  basil: "bg-basil text-white shadow-sm hover:bg-basil/90 hover:shadow-md",
  ghost: "text-muted hover:bg-paper hover:text-ink",
  danger: "text-muted hover:text-tomato",
  /** Primary action on a dark or photo background. */
  inverse: "bg-white text-ink shadow-sm hover:bg-white/90 hover:shadow-md",
  /** Secondary action on a dark or photo background. */
  glass: "border border-white/30 bg-white/10 text-white backdrop-blur hover:border-white/60",
} as const;

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type ButtonStyle = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** A light sweep across the button on hover, for the main call to action. */
  shine?: boolean;
};

export function buttonClass({ variant = "primary", size = "md", shine = false }: ButtonStyle = {}) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md font-medium",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-150",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    shine && "shine",
  );
}

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
