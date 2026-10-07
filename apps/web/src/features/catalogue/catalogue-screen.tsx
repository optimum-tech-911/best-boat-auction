import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { formatDay, formatMoney, formatSaleName, formatTime, href, interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { buttonClasses, ButtonContent, EmptyState, Icon, TabNav } from "@bba/ui";
import { LotCard } from "@/components/auction/lot-card";
import { LotRow } from "@/components/auction/lot-row";
import { auctionMessages } from "@/components/auction/messages";
import { getRequestContext } from "@/lib/backend";
import { catalogueSearch, parseCatalogueState, PAGE_SIZE, type CatalogueView, type SearchParamsRecord } from "./catalogue-params";
import { CatalogueNavigationProvider, PendingResults } from "./catalogue-navigation";
import { ActiveFilters, CatalogueToolbar } from "./catalogue-toolbar";
import { ClearFiltersButton } from "./clear-filters-button";
import { FilterPanel } from "./filter-panel";

const HOUR = 3_600_000;
/** Enough to read every result of a sale for the header summary. */
const RESULTS_LIMIT = 100;

/**
 * CAT: the current sale ("En cours") and the results archive ("Résultats"), both server-rendered
 * from the address, with the filter sidebar from 1024 px and the filter sheet below.
 */
export async function CatalogueScreen({ locale, messages, archive, searchParams }: { locale: Locale; messages: Messages; archive: boolean; searchParams: SearchParamsRecord }) {
  const state = parseCatalogueState(searchParams);
  const { backend, now } = await getRequestContext();
  const query = { ...state.filters, sort: state.sort ?? undefined, limit: state.show };
  const [page, sale, openTotal, allResults, previousSale] = await Promise.all([
    archive ? backend.catalogue.searchResults(query) : backend.catalogue.searchLots(query),
    backend.catalogue.getFeaturedSale(),
    backend.catalogue.searchLots({ limit: 0 }).then((result) => result.total),
    backend.catalogue.searchResults({ limit: RESULTS_LIMIT }),
    archive ? backend.catalogue.getPreviousSale() : Promise.resolve(null),
  ]);
  const closedTotal = allResults.total;
  // The results header sums up the last sale: boats sold and the amount they sold for.
  const sold = allResults.lots.filter((lot) => lot.state.outcome === "sold");
  const soldVolume = sold.reduce((total, lot) => total + (lot.state.priceCents ?? 0), 0);

  const copy = messages.catalogue;
  const card = auctionMessages(messages);
  const saleName = formatSaleName(sale.closingStartsAt, locale);
  // "Ordre de clôture" becomes the default view within an hour of the first closing.
  const defaultView: CatalogueView = !archive && now >= sale.closingStartsAt - HOUR ? "order" : "grid";
  const view = archive ? "grid" : state.view ?? defaultView;
  const filterMessages = { filters: copy.filters, fuels: copy.fuels, types: messages.categories.plural, countries: messages.countries };
  const nextShow = Math.min(page.total, state.show + PAGE_SIZE);

  return (
    <CatalogueNavigationProvider state={state}>
      <div className="page-container pb-24 pt-8 lg:pt-12">
        <nav aria-label={messages.a11y.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-2 type-body-s text-stone-600">
            <li><Link href={href(locale, "home")} className="hover:text-navy-900 hover:underline underline-offset-3">{copy.home}</Link></li>
            <li aria-hidden="true"><Icon icon={ChevronRight} size="s" /></li>
            <li aria-current="page" className="text-navy-900">{archive ? copy.resultsTitle : messages.nav.auctions}</li>
          </ol>
        </nav>

        <header className="mt-6">
          {archive ? (
            <>
              <h1 className="type-display-l text-navy-900">{copy.resultsTitle}</h1>
              <p className="mt-3 max-w-measure type-body-l text-stone-600">{copy.resultsIntro}</p>
              {previousSale && closedTotal > 0 && (
                <p className="mt-2 type-body-m numerals text-navy-900">
                  {plural(locale, copy.resultsSummary, sold.length, {
                    sale: formatSaleName(previousSale.closingStartsAt, locale),
                    total: closedTotal,
                    volume: formatMoney(soldVolume, locale),
                  })}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="type-eyebrow text-stone-600">
                {interpolate(copy.saleEyebrow, { sale: saleName, date: formatDay(sale.closingStartsAt, locale), time: formatTime(sale.closingStartsAt, locale, { compact: true }) })}
              </p>
              <h1 className="mt-3 type-display-l text-navy-900">{saleName}</h1>
              <p className="mt-3 type-body-l text-stone-600">
                {plural(locale, copy.summary, sale.lotCount, { date: formatDay(sale.viewingsUntil, locale, { weekday: false }) })}
              </p>
            </>
          )}
        </header>

        <TabNav
          className="mt-8"
          label={copy.tabs.label}
          items={[
            { href: href(locale, "auctions"), label: copy.tabs.live, count: openTotal, current: !archive },
            { href: href(locale, "results"), label: copy.tabs.results, count: closedTotal, current: archive },
          ]}
          linkComponent={Link}
        />

        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
          <aside aria-label={copy.filters.title} className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 max-h-screen overflow-y-auto pb-8">
              <h2 className="sr-only">{copy.filters.title}</h2>
              <FilterPanel locale={locale} facets={page.facets} archive={archive} messages={filterMessages} />
            </div>
          </aside>

          <div className="lg:col-span-9">
            <CatalogueToolbar
              locale={locale}
              total={page.total}
              facets={page.facets}
              archive={archive}
              defaultView={defaultView}
              messages={{ ...filterMessages, sort: copy.sort, views: copy.views, count: copy.count, close: messages.common.close }}
            />
            <div className="mt-4"><ActiveFilters locale={locale} messages={filterMessages} /></div>

            <PendingResults>
              {page.lots.length === 0 ? (
                <EmptyState icon={Search} title={copy.empty.title} action={<ClearFiltersButton label={copy.empty.action} />}>{copy.empty.text}</EmptyState>
              ) : view === "order" ? (
                <div className="mt-6 border-t border-stone-200">
                  {page.lots.map((lot) => <LotRow key={lot.id} lot={lot} locale={locale} messages={card} />)}
                </div>
              ) : (
                <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                  {page.lots.map((lot, index) => (
                    <li key={lot.id}>
                      <LotCard lot={lot} locale={locale} messages={card} headingLevel="h2" priority={index < 3} sizes="(max-width: 639px) 100vw, (max-width: 1279px) 45vw, 300px" />
                    </li>
                  ))}
                </ul>
              )}

              {page.lots.length > 0 && (
                <div className="mt-14 flex flex-col items-center gap-4">
                  <p className="type-body-s text-stone-600">{interpolate(copy.shown, { shown: page.lots.length, total: page.total })}</p>
                  {page.lots.length < page.total && (
                    <Link href={`${href(locale, archive ? "results" : "auctions")}${catalogueSearch({ ...state, show: nextShow })}`} scroll={false} className={buttonClasses({ variant: "secondary" })}>
                      <ButtonContent>{copy.more}</ButtonContent>
                    </Link>
                  )}
                  <p className="type-caption text-stone-600">{messages.demo.caption}</p>
                </div>
              )}
            </PendingResults>
          </div>
        </div>
      </div>
    </CatalogueNavigationProvider>
  );
}
