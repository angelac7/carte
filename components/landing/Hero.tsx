import { DepthRings } from "@/components/landing/DepthRings";
import { MenuDemo } from "@/components/landing/MenuDemo";
import { BlurFade } from "@/components/motion/BlurFade";
import { WordRotate } from "@/components/motion/WordRotate";
import { ButtonLink } from "@/components/ui/button";

const LANGUAGE_PHRASES = [
  "in Korean.",
  "en español.",
  "日本語で。",
  "en français.",
  "bằng tiếng Việt.",
  "用中文。",
  "in English.",
];

/** Opening section: oversized editorial type beside the live menu card, raised from the clay. */
export function Hero() {
  return (
    <section className="relative isolate snap-start overflow-hidden">
      <div
        aria-hidden="true"
        className="texture-grid absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.25fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <BlurFade>
            <p className="eyebrow text-muted">Allergen-confirmed menus · 7 languages</p>
          </BlurFade>
          <BlurFade delay={0.08}>
            <h1 className="mt-6 font-serif text-[clamp(3.5rem,15vw,9.5rem)] leading-[0.88] tracking-tighter">
              Every menu, <em className="text-accent">understood.</em>
            </h1>
          </BlurFade>
          <div aria-hidden="true" className="mt-8 flex items-center gap-3">
            <span className="h-1 w-24 bg-ink" />
            <span className="h-3 w-3 border-2 border-ink" />
          </div>
          <BlurFade delay={0.16}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
              Allergens confirmed by the kitchen. Every dish explained. The whole menu,{" "}
              <WordRotate words={LANGUAGE_PHRASES} className="font-serif text-ink italic" />
            </p>
          </BlurFade>
          <BlurFade delay={0.24}>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/discover" size="lg" shine>
                Find somewhere to eat <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href="/signup" size="lg" variant="secondary">
                Put your menu on Carte
              </ButtonLink>
            </div>
          </BlurFade>
        </div>

        <div className="relative">
          <DepthRings className="absolute -top-24 -right-20 -z-10 hidden sm:block" />
          <BlurFade delay={0.2}>
            <MenuDemo />
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
