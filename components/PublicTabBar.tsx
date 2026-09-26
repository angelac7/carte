"use client";
import { motion } from "motion/react";
import Link from "@/components/OfflineLink";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CompassIcon, HeartIcon, PinIcon, ScanIcon } from "@/components/icons";

type TabLabels = {
  discover: string;
  nearby: string;
  scanShort: string;
  myCarte: string;
  mainNav: string;
};

const ENGLISH: TabLabels = {
  discover: "Discover",
  nearby: "Nearby",
  scanShort: "Scan",
  myCarte: "My Carte",
  mainNav: "Main",
};

/** A thumb-reach tab bar for diners on phones. Larger screens use the header links instead. */
export function PublicTabBar({ labels = ENGLISH }: { labels?: TabLabels }) {
  const pathname = usePathname();
  const TABS: { href: string; label: string; icon: ReactNode }[] = [
    { href: "/discover", label: labels.discover, icon: <CompassIcon /> },
    { href: "/places", label: labels.nearby, icon: <PinIcon /> },
    { href: "/scan", label: labels.scanShort, icon: <ScanIcon /> },
    { href: "/my", label: labels.myCarte, icon: <HeartIcon /> },
  ];

  return (
    <nav
      aria-label={labels.mainNav}
      className="fixed inset-x-3 bottom-3 z-20 rounded-panel bg-paper/95 p-1.5 shadow-raised-lg backdrop-blur md:hidden print:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative isolate flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-muted transition-colors aria-[current=page]:text-accent"
              >
                {active && (
                  <motion.span
                    layoutId="tab-highlight"
                    className="absolute inset-0 -z-10 rounded-[1.5rem] shadow-pressed-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="h-6 w-6">{tab.icon}</span>
                <span className="font-mono text-[10px] leading-none tracking-wide uppercase">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
