import Link from "next/link";
import { FeatureShowcase, type Feature } from "@/components/landing/FeatureShowcase";
import { Hero } from "@/components/landing/Hero";
import { MediaFrame } from "@/components/landing/MediaFrame";
import { ParallaxBand } from "@/components/landing/ParallaxBand";
import { BlurFade } from "@/components/motion/BlurFade";
import { DotPattern } from "@/components/motion/DotPattern";
import { Marquee } from "@/components/motion/Marquee";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { Particles } from "@/components/motion/Particles";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ButtonLink } from "@/components/ui/button";
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
  const ownersImage = publicAsset("images/owners.jpg");

  return (
    <>
      <PublicHeader />
      <main className="landing-snap">
        <Hero image={publicAsset("images/hero.jpg")} video={publicAsset("videos/hero.mp4")} />

        <section
          aria-label="Restaurants and cuisines on Carte"
          className="snap-start space-y-4 bg-ink py-8 text-white"
        >
          <Marquee duration={50}>
            {restaurants.length >= 3
              ? restaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/r/${restaurant.slug}`}
                    className="font-serif text-3xl whitespace-nowrap text-white/80 transition-colors hover:text-white"
                  >
                    {restaurant.name}{" "}
                    <span aria-hidden="true" className="px-4 text-saffron">
                      ✦
                    </span>
                  </Link>
                ))
              : CUISINES.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="font-serif text-3xl whitespace-nowrap text-white/80"
                  >
                    {cuisine}{" "}
                    <span aria-hidden="true" className="px-4 text-saffron">
                      ✦
                    </span>
                  </span>
                ))}
          </Marquee>
          <Marquee duration={35} reverse>
            {MENU_WORDS.map((word) => (
              <span key={word} className="text-lg whitespace-nowrap text-white/50">
                {word}{" "}
                <span aria-hidden="true" className="px-6">
                  ·
                </span>
              </span>
            ))}
          </Marquee>
        </section>

        <section className="snap-start px-5 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <BlurFade key={stat.label} delay={index * 0.08}>
                <NumberTicker
                  value={stat.value}
                  className="block font-serif text-6xl leading-none sm:text-7xl"
                />
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted">
                  {stat.label}
                </p>
              </BlurFade>
            ))}
          </div>
        </section>

        <section className="snap-start px-5 pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            <BlurFade>
              <h2 className="max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
                Built for the person reading the menu.
              </h2>
            </BlurFade>
            <div className="mt-12">
              <FeatureShowcase features={features} />
            </div>
          </div>
        </section>

        <ParallaxBand image={publicAsset("images/band.jpg")} />

        <section className="snap-start bg-ink px-5 py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <BlurFade>
              <MediaFrame
                src={ownersImage}
                alt="A restaurant owner in their kitchen"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/5] rounded-2xl"
                tone="ink"
              />
            </BlurFade>
            <div>
              <BlurFade>
                <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
                  For restaurants, it takes one photo.
                </h2>
              </BlurFade>
              <ul className="mt-10 space-y-3">
                {OWNER_POINTS.map((point, index) => (
                  <li key={point}>
                    <BlurFade delay={index * 0.08}>
                      <SpotlightCard className="border-white/10 bg-white/5 p-5">
                        <p className="flex gap-3 leading-relaxed text-white/85">
                          <span aria-hidden="true" className="text-basil-soft">
                            ✓
                          </span>
                          {point}
                        </p>
                      </SpotlightCard>
                    </BlurFade>
                  </li>
                ))}
              </ul>
              <BlurFade delay={0.3}>
                <ButtonLink href="/signup" size="lg" variant="inverse" shine className="mt-10">
                  Put your menu on Carte
                </ButtonLink>
              </BlurFade>
            </div>
          </div>
        </section>

        <section className="relative isolate snap-start overflow-hidden px-5 py-24 sm:py-32">
          <DotPattern className="-z-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
          <Particles className="-z-10" />
          <div className="mx-auto max-w-3xl text-center">
            <BlurFade>
              <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-7xl">
                Find somewhere you can eat tonight.
              </h2>
            </BlurFade>
            <BlurFade delay={0.15}>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/discover" size="lg" shine>
                  Discover restaurants
                </ButtonLink>
                <ButtonLink href="/places" size="lg" variant="secondary">
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
