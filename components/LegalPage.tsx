import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_UPDATED, legalContactEmail } from "@/lib/legal";

/** A long-form policy page, set for easy reading. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const email = legalContactEmail();
  return (
    <>
      <PublicHeader />
      <main
        id="main"
        className="mx-auto max-w-2xl px-5 py-16 sm:py-24 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:tracking-tight [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
      >
        <p className="eyebrow text-muted">Last updated {LEGAL_UPDATED}</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
          {title}
        </h1>
        <div className="text-base leading-relaxed">{children}</div>
        <h2>Contact</h2>
        <p>
          {email ? (
            <>
              Questions or requests? Email{" "}
              <a href={`mailto:${email}`} className="underline underline-offset-4">
                {email}
              </a>
              .
            </>
          ) : (
            "Contact details are coming soon."
          )}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
