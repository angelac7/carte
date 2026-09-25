import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account deleted | Carte" };

export default function GoodbyePage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto max-w-xl px-5 py-24 pb-32 md:pb-24">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
          Your account is deleted
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Your login, restaurant, menu, and photos have been removed from Carte. Thanks for trying
          it.
        </p>
        <ButtonLink href="/" className="mt-10">
          Back to Carte
        </ButtonLink>
      </main>
    </>
  );
}
