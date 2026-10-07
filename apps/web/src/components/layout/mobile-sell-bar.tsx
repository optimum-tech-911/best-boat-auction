"use client";

import { SellDiscoveryLink } from "@/features/seller/seller-discovery";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { href, matchRoute, type Locale } from "@bba/i18n";
import { buttonClasses, ButtonContent, cx } from "@bba/ui";

/** Sections that already offer "Vendre mon bateau" mark themselves with this attribute. */
const SELL_CTA_SELECTOR = "[data-sell-cta]";

/**
 * G1 mobile bottom bar: a 64 px ivory bar with the "Vendre mon bateau" button on public pages
 * under 1024 px. Lot pages show their bid bar instead, and the sell page needs no link to itself.
 * While a section with its own sell button is on screen (the homepage hero), the bar stays out of
 * the way and slides in once it has scrolled past.
 */
export function MobileSellBar({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const route = matchRoute(pathname)?.route;
  const [covered, setCovered] = useState<{ path: string; inView: boolean } | null>(null);

  useEffect(() => {
    const target = document.querySelector(SELL_CTA_SELECTOR);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setCovered({ path: pathname, inView: entry?.isIntersecting ?? false }));
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  if (route === "lot" || route === "sell" || route === "sellListing" || route === "designSystem") return null;
  // Until the observer reports, the homepage starts with its hero in view.
  const hidden = covered?.path === pathname ? covered.inView : route === "home";
  return (
    <div
      data-mobile-sell-bar
      inert={hidden}
      className={cx(
        "fixed inset-x-0 bottom-0 z-sticky flex h-bar-mobile items-center border-t border-stone-300 bg-ivory-100 transition-transform duration-base lg:hidden",
        hidden && "translate-y-full",
      )}
    >
      <div className="page-container">
        <SellDiscoveryLink href={href(locale, "sell")} className={buttonClasses({ variant: "primary", size: "md", fullWidth: true })}>
          <ButtonContent>{label}</ButtonContent>
        </SellDiscoveryLink>
      </div>
    </div>
  );
}
