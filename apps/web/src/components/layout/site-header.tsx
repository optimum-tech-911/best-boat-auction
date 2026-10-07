"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Heart, Menu, Search, X } from "lucide-react";
import { href, matchRoute, plural, type Locale, type Messages, type RouteName } from "@bba/i18n";
import { BrandLogo, Button, buttonClasses, ButtonContent, cx, Dialog, Field, Icon, TextInput } from "@bba/ui";
import { useAuthDialog } from "@/features/account/auth-dialog";
import { SellDiscoveryLink } from "@/features/seller/seller-discovery";
import { useViewer, useWatchlist } from "@/features/live/live-auction";
import { LanguageSwitch } from "./language-switch";

export interface HeaderMessages {
  nav: Messages["nav"];
  a11y: Messages["a11y"];
  common: Messages["common"];
}

const navigation: readonly { route: RouteName; label: keyof Messages["nav"]; active: readonly RouteName[] }[] = [
  { route: "auctions", label: "auctions", active: ["auctions", "lot"] },
  { route: "results", label: "results", active: ["results"] },
  { route: "calendar", label: "calendar", active: ["calendar"] },
  { route: "howItWorks", label: "howItWorks", active: ["howItWorks"] },
];

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

/**
 * G1 header: always solid and sticky; 72 px from 1024 px, 60 px below with a full-screen menu sheet.
 * The French navigation and actions need about 1,120 px, so the full desktop row starts at 1280 px;
 * from 1024 px the header keeps its height, search and the sell button, with the links in the menu.
 */
export function SiteHeader({ locale, messages }: { locale: Locale; messages: HeaderMessages }) {
  const { nav, a11y } = messages;
  const pathname = usePathname();
  const current = matchRoute(pathname)?.route;
  // The menu belongs to the page it was opened on, so following one of its links closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const [searchOpen, setSearchOpen] = useState(false);
  const viewer = useViewer();
  const watchlist = useWatchlist();
  const auth = useAuthDialog();

  const links = navigation.map((item) => ({ ...item, href: href(locale, item.route), current: current ? item.active.includes(current) : false }));
  const account = viewer
    ? <Link href={href(locale, "account")} aria-label={nav.account} className="grid size-avatar place-items-center rounded-full bg-navy-900 type-caption text-ivory-100">{initials(viewer.displayName)}</Link>
    : <button type="button" onClick={() => auth.open()} className="h-control-md px-2 type-body-m font-medium text-navy-900 hover:underline underline-offset-4">{nav.signIn}</button>;

  return (
    <header className="sticky top-0 z-header border-b border-stone-300 bg-ivory-100">
      <div className="page-container flex h-header-mobile items-center gap-6 lg:h-header">
        <Link href={href(locale, "home")} aria-label={a11y.homeLink} className="shrink-0">
          <BrandLogo className="w-logo-sm lg:w-logo" />
        </Link>

        <nav aria-label={a11y.primaryNavigation} className="hidden xl:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.route}>
                <Link
                  href={link.href}
                  aria-current={link.current ? "page" : undefined}
                  className={cx(
                    "relative flex h-header items-center whitespace-nowrap type-body-m font-medium text-navy-900",
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-underline after:origin-left after:bg-teal-700 after:transition-transform after:duration-panel",
                    link.current ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                  )}
                >
                  {nav[link.label] as string}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label={nav.search} className="grid size-control-md place-items-center rounded-sm text-navy-900 hover:bg-stone-100">
            <Icon icon={Search} size="l" />
          </button>
          <Link href={href(locale, "account")} aria-label={plural(locale, nav.watchlistCount, watchlist.length)} className="relative hidden size-control-md place-items-center rounded-sm text-navy-900 hover:bg-stone-100 xl:grid">
            <Icon icon={Heart} size="l" />
            {watchlist.length > 0 && <span className="absolute right-1 top-1 grid min-w-icon-s place-items-center rounded-xs bg-navy-900 px-1 type-caption text-ivory-100 numerals">{watchlist.length}</span>}
          </Link>
          <div className="hidden xl:block">
            <Suspense><LanguageSwitch locale={locale} labelTemplate={a11y.currentLanguage} /></Suspense>
          </div>
          <div className="hidden xl:block">{account}</div>
          <SellDiscoveryLink href={href(locale, "sell")} className={buttonClasses({ variant: "primary", size: "md", className: "ml-3 hidden lg:inline-flex" })}>
            <ButtonContent>{nav.sell}</ButtonContent>
          </SellDiscoveryLink>
          <button type="button" onClick={() => setMenuPath(pathname)} aria-label={a11y.openMenu} aria-expanded={menuOpen} className="grid size-control-md place-items-center rounded-sm text-navy-900 hover:bg-stone-100 xl:hidden">
            <Icon icon={Menu} size="l" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <MobileMenu locale={locale} messages={messages} links={links} account={account} onClose={() => setMenuPath(null)} />
      )}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} messages={messages} />
    </header>
  );
}

interface MobileMenuProps {
  locale: Locale;
  messages: HeaderMessages;
  links: readonly { route: RouteName; label: keyof Messages["nav"]; href: string; current: boolean }[];
  account: ReactNode;
  onClose: () => void;
}

/** The full-screen menu sheet under 1024 px: links in display-s, language, sign-in and the sell button. */
function MobileMenu({ locale, messages, links, account, onClose }: MobileMenuProps) {
  const { nav, a11y } = messages;
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={nav.menu} className="motion-sheet-in fixed inset-0 z-dialog flex flex-col overflow-y-auto bg-ivory-100 xl:hidden">
      <div className="page-container flex h-header-mobile shrink-0 items-center justify-between border-b border-stone-300">
        <BrandLogo className="w-logo-sm" />
        <button type="button" onClick={onClose} aria-label={a11y.closeMenu} autoFocus className="grid size-control-md place-items-center rounded-sm text-navy-900">
          <Icon icon={X} size="l" />
        </button>
      </div>
      <nav aria-label={a11y.primaryNavigation} className="page-container flex-1 py-8">
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.route}>
              <Link href={link.href} aria-current={link.current ? "page" : undefined} className={cx("flex min-h-control-lg items-center type-display-s", link.current ? "text-teal-700" : "text-navy-900")}>
                {nav[link.label] as string}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
          <Suspense><LanguageSwitch locale={locale} labelTemplate={a11y.currentLanguage} /></Suspense>
          {account}
        </div>
      </nav>
      <div className="page-container pb-8">
        <SellDiscoveryLink href={href(locale, "sell")} onClick={onClose} className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}>
          <ButtonContent size="lg">{nav.sell}</ButtonContent>
        </SellDiscoveryLink>
      </div>
    </div>
  );
}

function SearchDialog({ open, onClose, locale, messages }: { open: boolean; onClose: () => void; locale: Locale; messages: HeaderMessages }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onClose();
    router.push(href(locale, "auctions", {}, { q: query.trim() || undefined }));
  };
  return (
    <Dialog open={open} onClose={onClose} title={messages.nav.searchTitle} closeLabel={messages.common.close}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={messages.nav.searchLabel}>
          {({ id, describedBy }) => (
            <TextInput id={id} aria-describedby={describedBy} type="search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={messages.nav.searchPlaceholder} />
          )}
        </Field>
        <Button type="submit" variant="primary" arrow className="self-end">{messages.nav.searchAction}</Button>
      </form>
    </Dialog>
  );
}
