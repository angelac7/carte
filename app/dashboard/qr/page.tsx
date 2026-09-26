import { headers } from "next/headers";
import QRCode from "qrcode";
import { EmbedCode } from "@/components/owner/EmbedCode";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { PrintButton } from "@/components/PrintButton";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { fmt } from "@/lib/i18n/owner/format";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.nav.qr);

export default async function QrPage() {
  const { restaurant } = await requireRestaurant("/dashboard/qr");
  const { t } = await ownerStrings();
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
  const embedPath = `/embed/${restaurant.slug}`;
  const embedCode = `<iframe src="${protocol}://${host}${embedPath}" title="${restaurant.name.replace(/"/g, "&quot;")} menu" loading="lazy" style="width:100%;height:900px;border:0;border-radius:16px"></iframe>`;

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={t.qr.title} intro={t.qr.intro} />
      {isLocalOnly && <Notice className="mt-4 print:hidden">{t.qr.localOnly}</Notice>}

      <div className="mt-10 flex flex-col items-center rounded-panel bg-paper px-6 py-12 text-center shadow-raised print:bg-white print:shadow-none">
        <p className="font-serif text-4xl tracking-tight">{restaurant.name}</p>
        <p className="eyebrow mt-3 text-muted">{t.qr.scanLine}</p>
        {/* A data URL, so Next's image optimizer isn't needed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={fmt(t.qr.qrAlt, { url: menuUrl })}
          className="mt-8 aspect-square w-full max-w-64 rounded-[1.25rem] bg-white p-3 shadow-pressed print:shadow-none"
        />
        <p className="mt-5 font-mono text-xs break-all text-muted">{menuUrl}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton label={t.qr.print} />
        <ButtonLink href={menuPath} variant="secondary">
          {t.qr.open}
        </ButtonLink>
      </div>

      <section className="mt-12 rounded-panel bg-paper p-6 shadow-raised sm:p-8 print:hidden">
        <h2 className="font-serif text-3xl tracking-tight">{t.qr.websiteTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.qr.websiteIntro}</p>
        <div className="mt-5">
          <EmbedCode code={embedCode} />
        </div>
        <a
          href={embedPath}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
        >
          {t.qr.preview} <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}
