import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { PrintButton } from "@/components/PrintButton";
import { requireRestaurant } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QR code | Carte" };

export default async function QrPage() {
  const { restaurant } = await requireRestaurant();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const menuPath = `/r/${restaurant.slug}`;
  const menuUrl = `${protocol}://${host}${menuPath}`;

  const svg = await QRCode.toString(menuUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#1c2a39", light: "#ffffff" },
  });
  const qrSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const isLocalOnly = host.startsWith("localhost") || host.startsWith("127.");

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="print:hidden">
        <h1 className="font-serif text-4xl leading-tight">Table QR code</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          Print this and place it on your tables. Diners scan it to open your menu with allergen and
          diet filters.
        </p>
        {isLocalOnly && (
          <p
            role="note"
            className="mt-4 rounded-md bg-saffron-soft px-4 py-3 text-sm leading-relaxed text-saffron-ink"
          >
            This code points to localhost, which only works on this computer. It will work on any
            phone once Carte is online.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center rounded-lg border border-line bg-card px-6 py-10 text-center print:border-0">
        <p className="font-serif text-3xl">{restaurant.name}</p>
        <p className="mt-2 text-sm text-muted">Scan for our menu, with allergen and diet filters</p>
        {/* A data URL, so Next's image optimizer isn't needed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt={`QR code linking to ${menuUrl}`} className="mt-6 h-64 w-64" />
        <p className="mt-4 text-xs break-all text-muted">{menuUrl}</p>
      </div>

      <div className="mt-6 flex gap-4 print:hidden">
        <PrintButton label="Print QR code" />
        <Link
          href={menuPath}
          className="rounded-md border border-line px-4 py-2 text-sm hover:border-muted"
        >
          Open diner menu
        </Link>
      </div>
    </main>
  );
}
