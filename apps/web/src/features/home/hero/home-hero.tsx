import Link from "next/link";
import { getImageProps } from "next/image";
import { preload } from "react-dom";
import type { LotSummary, SaleSummary } from "@bba/contracts";
import { href, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent } from "@bba/ui";
import { HeroRail } from "./hero-rail";
import "./hero.css";

/** Temporary credited photography (assets/CREDITS.md). Replace both files to change the hero; nothing else moves. */
const heroMedia = {
  desktop: { src: "/images/heroes/home.jpg", width: 2600, height: 1733 },
  mobile: { src: "/images/heroes/home-mobile.jpg", width: 1080, height: 1920 },
} as const;

function heroImages(alt: string) {
  const common = { alt, quality: 75, sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;
  return {
    desktop: getImageProps({ ...common, ...heroMedia.desktop }).props,
    mobile: getImageProps({ ...common, ...heroMedia.mobile }).props,
  };
}

interface HomeHeroProps {
  locale: Locale;
  messages: Messages["home"]["hero"];
  sale: SaleSummary;
  lots: readonly LotSummary[];
}

/** H1: the locked hero composition with D1.1 tokens, the live auction rail and M17. */
export function HomeHero({ locale, messages, sale, lots }: HomeHeroProps) {
  const { desktop, mobile } = heroImages(messages.photoAlt);
  // The largest element on every screen: preload the art-directed source that applies.
  preload(mobile.src, { as: "image", imageSrcSet: mobile.srcSet, imageSizes: "100vw", fetchPriority: "high", media: "(max-width: 767px)" });
  preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: "100vw", fetchPriority: "high", media: "(min-width: 768px)" });

  return (
    <section aria-label={messages.label} className="hero" data-sell-cta>
      <div className="hero__media">
        <picture>
          <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" width={heroMedia.mobile.width} height={heroMedia.mobile.height} />
          {/* A native img: getImageProps supplies Next's responsive sources for art direction. */}
          <img {...desktop} alt={messages.photoAlt} className="hero__image" />
        </picture>
        <div className="hero__shade" aria-hidden="true" />
      </div>

      <div className="hero__main page-container">
        <div className="hero__content">
          <p className="hero-enter hero-enter--eyebrow type-eyebrow text-ivory-100">{messages.eyebrow}</p>
          <h1 className="hero-enter hero-enter--heading mt-6 type-display-xl text-ivory-100">
            {messages.title.map((line) => <span key={line} className="block">{line}</span>)}
          </h1>
          <p className="hero-enter hero-enter--description mt-6 max-w-intro type-body-l text-ivory-100">{messages.description}</p>
          <div className="hero-enter hero-enter--actions mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={href(locale, "auctions")} className={buttonClasses({ variant: "primary-inverse", size: "lg", className: "w-full sm:w-auto" })}>
              <ButtonContent arrow size="lg">{messages.browse}</ButtonContent>
            </Link>
            <Link href={href(locale, "sell")} className={buttonClasses({ variant: "secondary-inverse", size: "lg", className: "w-full sm:w-auto" })}>
              <ButtonContent size="lg">{messages.sell}</ButtonContent>
            </Link>
          </div>
          <ul className="hero-enter hero-enter--trust mt-6 flex flex-wrap gap-x-4 gap-y-1 type-caption text-ivory-100 sm:gap-x-0">
            {messages.trust.map((item, index) => (
              <li key={item} className="flex">
                {index > 0 && <span aria-hidden="true" className="hidden px-2 sm:inline">·</span>}
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <HeroRail locale={locale} sale={sale} lots={lots} messages={messages.rail} />
    </section>
  );
}
