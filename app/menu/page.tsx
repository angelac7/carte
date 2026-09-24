import type { Metadata } from "next";
import { DinerMenu } from "@/components/DinerMenu";
import { readItems } from "@/lib/db";
import { confirmedOnly } from "@/lib/menu-filters";

// Read fresh data on every visit so owner changes show up right away.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Menu | Carte" };

export default function MenuPage() {
  // Filtering happens on the server, so unconfirmed dishes never reach a diner's browser.
  return <DinerMenu dishes={confirmedOnly(readItems())} />;
}
