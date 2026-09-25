"use client";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, type ReactNode } from "react";

export type DockItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  badge?: number;
};

function DockButton({
  item,
  pointerX,
  still,
}: {
  item: DockItem;
  pointerX: MotionValue<number>;
  still: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(pointerX, (x) => {
    const box = ref.current?.getBoundingClientRect();
    return box ? x - (box.left + box.width / 2) : Infinity;
  });
  const size = useSpring(useTransform(distance, [-140, 0, 140], [56, 70, 56]), {
    stiffness: 260,
    damping: 20,
  });

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={item.onClick}
      style={{ width: still ? 56 : size, height: still ? 56 : size }}
      className="relative flex flex-col items-center justify-center gap-1 rounded-control text-ink transition-[box-shadow,color] duration-200 hover:text-accent active:shadow-pressed-sm"
    >
      <span className="h-6 w-6">{item.icon}</span>
      <span className="font-mono text-[10px] leading-none tracking-wide uppercase">
        {item.label}
      </span>
      {item.badge ? (
        <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] font-medium text-white tabular-nums">
          {item.badge}
        </span>
      ) : null}
    </motion.button>
  );
}

/** A floating toolbar at the bottom of the diner menu. Icons grow as the mouse passes over them. */
export function MenuDock({ items, label }: { items: DockItem[]; label: string }) {
  const pointerX = useMotionValue(Infinity);
  const still = useReducedMotion() ?? false;

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4 print:hidden"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.6, delay: 0.3 }}
        onMouseMove={(event) => pointerX.set(event.clientX)}
        onMouseLeave={() => pointerX.set(Infinity)}
        className="flex items-end gap-1 rounded-panel bg-paper/95 p-2 shadow-raised-lg backdrop-blur"
      >
        {items.map((item) => (
          <DockButton key={item.id} item={item} pointerX={pointerX} still={still} />
        ))}
      </motion.div>
    </nav>
  );
}
