import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { redirectIfSignedIn } from "@/lib/auth";

export default async function LandingPage() {
  await redirectIfSignedIn();

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          Your menu, clear for every diner.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Upload a photo of your menu. Carte suggests allergens for you to confirm, then gives
          diners a menu they can filter, translate, and ask questions about.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
          >
            Create your menu
          </Link>
          <Link
            href="/discover"
            className="rounded-md border border-line px-5 py-2.5 text-sm hover:border-muted"
          >
            Find somewhere to eat
          </Link>
        </div>
      </main>
    </>
  );
}
