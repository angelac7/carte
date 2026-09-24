import Link from "next/link";
import { FeatureShowcase, type Feature } from "@/components/landing/FeatureShowcase";
import { Hero } from "@/components/landing/Hero";
import { BlurFade } from "@/components/motion/BlurFade";
import { Marquee } from "@/components/motion/Marquee";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { Particles } from "@/components/motion/Particles";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ButtonLink } from "@/components/ui/button";
import { panelClass } from "@/components/ui/panel";
import { redirectIfSignedIn } from "@/lib/auth";
import { searchRestaurants } from "@/lib/db/discover";
import { publicAsset } from "@/lib/public-asset";
import { createClient } from "@/lib/supabase/server";

const CUISINES = [
  "Korean",
  "Ramen",
  "Tacos",
  "Pho",
  "Sushi",
  "Pizza",
  "Thai",
  "Dim sum",
  "Falafel",
  "Curry",
  "Pasta",
  "Bibimbap",
];
const MENU_WORDS = ["Menu", "Menú", "메뉴", "メニュー", "菜单", "Thực đơn", "Carte"];

const STATS = [
  { value: 7, label: "languages, with allergen names written by people" },
  { value: 9, label: "major allergens, confirmed by the kitchen" },
  { value: 1, label: "photo is all it takes to build a menu" },
  { value: 0, label: "accounts needed to use Carte as a diner" },
];

const OWNER_POINTS = [
  "Snap a photo of your menu, and Carte lists every dish in about 20 seconds.",
  "Confirm allergens dish by dish. Nothing reaches diners until you do.",
  "Print a QR code. Diners read your menu in 7 languages and get answers to their questions.",
  "Show up on Carte Discover and the map, with your hours and occasions.",
];

const FEATURE_COPY: Omit<Feature, "image">[] = [
  {
    id: "filters",
    title: "Filter out your allergies",
    body: "Hide every dish with an allergen you avoid. Your filters are remembered on your phone at every Carte restaurant.",
    imageAlt: "A plate of food, close up",
  },
  {
    id: "languages",
    title: "Read any menu in your language",
    body: "Seven languages, with allergen names and safety notes written by people, never guessed by AI.",
    imageAlt: "Hands holding a restaurant menu",
  },
  {
    id: "details",
    title: "Know exactly what you’re ordering",
    body: "Tap any dish to learn what it is, how it tastes, how spicy it is, and how to say its name.",
    imageAlt: "A steaming bowl of ramen",
  },
  {
    id: "ask",
    title: "Ask the menu anything",
    body: "Type or speak a question and get answers from the restaurant’s confirmed menu, and nothing else.",
    imageAlt: "A phone on a restaurant table",
  },
  {
    id: "order",
    title: "Order together, split with ease",
    body: "Build your order, show it to staff with your allergies, and split the bill with tax and tip.",
    imageAlt: "Friends sharing a meal",
  },
  {
    id: "scan",
    title: "Scan menus anywhere",
    body: "At a restaurant that isn’t on Carte yet, photograph the menu to translate it and flag possible allergens.",
    imageAlt: "A street food menu board",
  },
];

export default async function LandingPage() {
  await redirectIfSignedIn();

  const restaurants = await searchRestaurants(await createClient(), "").catch(() => []);
  const features: Feature[] = FEATURE_COPY.map((feature) => ({
    ...feature,
    image: publicAsset(`images/feature-${feature.id}.jpg`),
  }));
  return (
    <>
      <ScrollProgress />
      <PublicHeader />
      <main id="main" className="landing-snap">
        <Hero />

        {/* Inverted ink band: what's on Carte, then the numbers. */}
        <section aria-label="Carte in numbers" className="texture-ink snap-start text-white">
          <div aria-label="Restaurants and cuisines on Carte" className="space-y-4 py-8">
            <Marquee duration={50}>
              {restaurants.length >= 3
                ? restaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/r/${restaurant.slug}`}
                      className="font-serif text-3xl whitespace-nowrap text-white/80 italic transition-colors hover:text-white"
                    >
                      {restaurant.name}{" "}
                      <span aria-hidden="true" className="px-4 text-accent-glow not-italic">
                        ✦
                      </span>
                    </Link>
                  ))
                : CUISINES.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="font-serif text-3xl whitespace-nowrap text-white/80 italic"
                    >
                      {cuisine}{" "}
                      <span aria-hidden="true" className="px-4 text-accent-glow not-italic">
                        ✦
                      </span>
                    </span>
                  ))}
            </Marquee>
            <Marquee duration={35} reverse>
              {MENU_WORDS.map((word) => (
                <span key={word} className="eyebrow whitespace-nowrap text-white/45">
                  {word}{" "}
                  <span aria-hidden="true" className="px-6">
                    ·
                  </span>
                </span>
              ))}
            </Marquee>
          </div>
          <div className="border-t border-white/15">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 px-5 lg:grid-cols-4">
              {STATS.map((stat, index) => (
                <BlurFade
                  key={stat.label}
                  delay={index * 0.08}
                  className="border-l border-white/15 py-12 pr-4 pl-5 lg:py-16"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <NumberTicker
                      value={stat.value}
                      className="block font-serif text-7xl leading-none tracking-tighter sm:text-8xl"
                    />
                    <p className="eyebrow mt-4 max-w-[14rem] leading-relaxed text-white/60">
                      {stat.label}
                    </p>
                  </dd>
                </BlurFade>
              ))}
            </dl>
          </div>
        </section>

        <section className="snap-start px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between border-t-4 border-ink pt-5">
              <p className="eyebrow">01 — For diners</p>
              <p className="eyebrow hidden text-muted sm:block">Six things Carte does</p>
            </div>
            <BlurFade>
              <h2 className="mt-10 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tighter sm:text-7xl">
                Built for the person <em className="text-accent">reading</em> the menu.
              </h2>
            </BlurFade>
            <div className="mt-16">
              <FeatureShowcase features={features} />
            </div>
          </div>
        </section>

        <section className="snap-start px-5 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
            <div>
              <div className="border-t-4 border-ink pt-5">
                <p className="eyebrow">02 — For restaurants</p>
              </div>
              <BlurFade>
                <h2 className="mt-10 font-serif text-5xl leading-[0.95] tracking-tighter sm:text-7xl">
                  It takes <em className="text-accent">one photo.</em>
                </h2>
              </BlurFade>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
                Carte reads your paper menu, you confirm every allergen, and diners get a menu they
                can trust in their own language.
              </p>
              <ButtonLink href="/signup" size="lg" shine className="mt-10">
                Put your menu on Carte <span aria-hidden="true">→</span>
              </ButtonLink>
            </div>
            <ol className="space-y-5">
              {OWNER_POINTS.map((point, index) => (
                <li key={point}>
                  <BlurFade delay={index * 0.08}>
                    <div className={panelClass("flex items-start gap-5 p-6 sm:p-7")}>
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm text-accent shadow-well"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="pt-2.5 leading-relaxed">{point}</p>
                    </div>
                  </BlurFade>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="texture-ink relative isolate snap-start overflow-hidden border-b border-white/10 px-5 py-28 text-white sm:py-40">
          <Particles className="-z-10 opacity-40" color="#ffffff" />
          <div className="mx-auto max-w-4xl text-center">
            <p className="eyebrow text-white/60">03 — Tonight</p>
            <BlurFade>
              <h2 className="mt-8 font-serif text-5xl leading-[0.95] tracking-tighter sm:text-8xl">
                Find somewhere you <em className="text-accent-glow">can</em> eat tonight.
              </h2>
            </BlurFade>
            <BlurFade delay={0.15}>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <ButtonLink href="/discover" size="lg" variant="inverse">
                  Discover restaurants <span aria-hidden="true">→</span>
                </ButtonLink>
                <ButtonLink href="/places" size="lg" variant="glass">
                  See what’s nearby
                </ButtonLink>
              </div>
            </BlurFade>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
