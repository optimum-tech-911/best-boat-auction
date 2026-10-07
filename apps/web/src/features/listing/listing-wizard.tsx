"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { countryCodes, type ListingResult } from "@bba/contracts";
import { checkListing, defaultListingRules, defaultSellerOffer, listingSteps, photosRequired, type ListingIssue, type ListingStep } from "@bba/domain";
import { formatDay, formatMoney, formatNumber, formatSaleName, href, interpolate, plural, type Locale } from "@bba/i18n";
import { Button, buttonClasses, ButtonContent, cx, Icon } from "@bba/ui";
import { useLiveAuction } from "@/features/live/live-auction";
import { clearStoredDraft, emptyDraft, readStoredDraft, storeDraft, toListingInput, toListingRequest, type DraftPhoto, type DraftPrefill, type ListingDraft } from "./listing-draft";
import { BoatStep, ContactStep, LocationStep, PresentationStep, PriceStep } from "./listing-steps";
import type { ListingClientMessages, ListingSale } from "./listing-types";

type ListingSuccess = Extract<ListingResult, { ok: true }>;

interface ListingWizardProps {
  locale: Locale;
  messages: ListingClientMessages;
  prefill: DraftPrefill;
  sale: ListingSale | null;
  currentYear: number;
}

const subscribeNever = () => () => {};

/**
 * SEL: the listing form in five steps. The draft is kept on this device as the seller types, and
 * restored on return; the form mounts again once in the browser so the server render never reads it.
 */
export function ListingWizard(props: ListingWizardProps) {
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [run, setRun] = useState(0);
  return (
    <ListingForm
      key={`${inBrowser}-${run}`}
      {...props}
      restore={inBrowser && run === 0}
      onRestart={() => {
        clearStoredDraft();
        setRun((current) => current + 1);
      }}
    />
  );
}

function ListingForm({ locale, messages, prefill, sale, currentYear, restore, onRestart }: ListingWizardProps & { restore: boolean; onRestart: () => void }) {
  const copy = messages.listing;
  const live = useLiveAuction();
  const [initial] = useState(() => {
    const stored = restore ? readStoredDraft(listingSteps.length) : null;
    if (!stored) return { draft: emptyDraft(prefill, locale), step: 0, restored: false };
    // A pack chosen on the sell page wins over the one in the saved draft.
    return { draft: prefill.pack ? { ...stored.draft, pack: prefill.pack } : stored.draft, step: stored.step, restored: true };
  });
  const [draft, setDraft] = useState<ListingDraft>(initial.draft);
  const [step, setStep] = useState(initial.step);
  const [furthest, setFurthest] = useState(initial.step);
  const [photos, setPhotos] = useState<readonly DraftPhoto[]>([]);
  const [checked, setChecked] = useState<ReadonlySet<ListingStep>>(new Set());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<ListingSuccess | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const photoUrls = useRef<string[]>([]);
  const moved = useRef(false);

  const current = listingSteps[step] ?? "boat";
  const issues = useMemo(() => checkListing(toListingInput(draft, photos.length), defaultSellerOffer, currentYear), [draft, photos.length, currentYear]);
  const stepIssues = checked.has(current) ? issues.filter((issue) => issue.step === current) : [];
  const dirty = initial.restored || draft !== initial.draft || step !== initial.step;

  // Keep the draft on this device; photos are files and stay in memory only.
  useEffect(() => {
    if (restore && dirty && !done) storeDraft(draft, step);
  }, [draft, step, restore, dirty, done]);

  // A new step: bring its title into view and give it focus, for keyboard and screen reader users.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    top.current?.scrollIntoView({ block: "start", behavior: reduced ? "instant" : "smooth" });
    heading.current?.focus({ preventScroll: true });
  }, [step, done]);

  // Release the photo previews when the form goes away.
  useEffect(() => () => photoUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const update = (patch: Partial<ListingDraft>) => setDraft((previous) => ({ ...previous, ...patch }));

  const goTo = (index: number) => {
    moved.current = true;
    setStep(index);
    setFurthest((reached) => Math.max(reached, index));
  };

  const errorText = (issue: ListingIssue): string => {
    const rules = defaultListingRules;
    const text = copy.errors[issue.code];
    switch (issue.code) {
      case "length_invalid":
        return interpolate(text, { min: formatNumber(rules.lengthMetres.min, locale), max: formatNumber(rules.lengthMetres.max, locale) });
      case "description_too_short":
        return interpolate(text, { min: rules.descriptionMinLength });
      case "country_unsupported":
        return interpolate(text, { countries: countryCodes.map((code) => messages.countries[code]).join(", ") });
      case "photos_required":
        return interpolate(text, { count: rules.minimumPhotos });
      case "start_too_low":
        return interpolate(text, { min: formatMoney(rules.minimumStartCents, locale) });
      default:
        return text;
    }
  };

  const errorFor = (field: string) => {
    const issue = stepIssues.find((candidate) => candidate.field === field);
    return issue ? errorText(issue) : undefined;
  };

  /** Shows the problems of the first step that has any, and moves there. */
  const showIssues = (found: readonly ListingIssue[]) => {
    const first = found[0];
    if (!first) return;
    setChecked((previous) => new Set([...previous, ...found.map((issue) => issue.step)]));
    const index = listingSteps.indexOf(first.step);
    if (index !== step) goTo(index);
    else requestAnimationFrame(() => summary.current?.focus());
  };

  const next = () => {
    const blocking = issues.filter((issue) => issue.step === current);
    if (blocking.length) showIssues(blocking);
    else goTo(step + 1);
  };

  const submit = async () => {
    if (issues.length) {
      showIssues(issues);
      return;
    }
    setBusy(true);
    try {
      const result = await live.services().seller.submitListing(toListingRequest(draft, photos));
      if (result.ok) {
        clearStoredDraft();
        moved.current = true;
        setDone(result);
      } else {
        showIssues(result.issues);
      }
    } finally {
      setBusy(false);
    }
  };

  const addPhotos = (files: File[]) => {
    const added = files.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    photoUrls.current.push(...added.map((photo) => photo.url));
    setPhotos((previous) => [...previous, ...added]);
  };
  const removePhoto = (id: string) => {
    setPhotos((previous) => {
      const photo = previous.find((candidate) => candidate.id === id);
      if (photo) URL.revokeObjectURL(photo.url);
      return previous.filter((candidate) => candidate.id !== id);
    });
  };
  const coverPhoto = (id: string) => {
    setPhotos((previous) => {
      const photo = previous.find((candidate) => candidate.id === id);
      return photo ? [photo, ...previous.filter((candidate) => candidate.id !== id)] : previous;
    });
  };

  if (done) {
    return <ListingDone locale={locale} messages={messages} result={done} topRef={top} headingRef={heading} />;
  }

  const stepProps = { locale, messages, draft, update, errorFor };
  const last = step === listingSteps.length - 1;

  return (
    <div ref={top} className="scroll-mt-24">
      <header>
        <p className="type-eyebrow text-teal-700">{copy.eyebrow}</p>
        <h1 className="mt-3 type-display-m text-balance text-navy-900">{copy.title}</h1>
        <p className="mt-4 max-w-intro type-body-l text-stone-600">{copy.intro}</p>
      </header>

      <nav aria-label={copy.progress} className="mt-10">
        <p className="type-label text-navy-900 sm:hidden">
          {interpolate(copy.stepCount, { current: step + 1, total: listingSteps.length })} · {copy.steps[current]}
        </p>
        <ol className="mt-3 grid grid-cols-5 gap-2 sm:mt-0">
          {listingSteps.map((name, index) => {
            const reachable = index <= furthest && index !== step;
            const state = index === step ? "current" : index < step || index <= furthest ? "visited" : "ahead";
            const label = (
              <>
                <span className={cx("block h-track rounded-xs transition-colors duration-panel", state === "ahead" ? "bg-stone-300" : "bg-navy-900")} />
                <span className="mt-3 hidden items-baseline gap-2 sm:flex">
                  <span className="type-num-s">{String(index + 1).padStart(2, "0")}</span>
                  <span className={cx("type-body-s", state === "current" && "font-semibold underline decoration-2 underline-offset-4")}>{copy.steps[name]}</span>
                </span>
              </>
            );
            return (
              <li key={name} className={state === "ahead" ? "text-stone-600" : "text-navy-900"}>
                {reachable ? (
                  <button type="button" onClick={() => goTo(index)} className="block w-full text-left hover:text-teal-700">
                    {label}
                    <span className="sr-only sm:hidden">{copy.steps[name]}</span>
                  </button>
                ) : (
                  <span aria-current={index === step ? "step" : undefined} className="block">
                    {label}
                    <span className="sr-only sm:hidden">{copy.steps[name]}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <section aria-labelledby="listing-step-title" className="mt-8 rounded-md border border-stone-300 bg-white p-5 sm:p-8">
        <h2 id="listing-step-title" ref={heading} tabIndex={-1} className="type-title-l text-navy-900 focus:outline-none">
          <span className="mr-3 type-num-m text-teal-700">{String(step + 1).padStart(2, "0")}</span>
          {copy.steps[current]}
        </h2>

        {stepIssues.length > 0 && (
          <div ref={summary} tabIndex={-1} role="alert" className="mt-6 rounded-sm border border-danger-700 bg-white p-4 focus:outline-none">
            <p className="flex items-center gap-2 type-label text-danger-700">
              <Icon icon={AlertCircle} size="s" />
              {plural(locale, copy.errorsTitle, stepIssues.length)}
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-8 type-body-s text-navy-900">
              {stepIssues.map((issue) => <li key={`${issue.field}-${issue.code}`}>{errorText(issue)}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-6">
          {current === "boat" && <BoatStep {...stepProps} />}
          {current === "location" && <LocationStep {...stepProps} />}
          {current === "presentation" && (
            <PresentationStep
              {...stepProps}
              photos={photos}
              required={photosRequired(draft.pack, defaultSellerOffer)}
              onAddPhotos={addPhotos}
              onRemovePhoto={removePhoto}
              onCoverPhoto={coverPhoto}
            />
          )}
          {current === "price" && <PriceStep {...stepProps} sale={sale} />}
          {current === "contact" && <ContactStep {...stepProps} photoCount={photos.length} onEdit={(name) => goTo(listingSteps.indexOf(name))} />}
        </div>
      </section>

      <div className="sticky bottom-0 z-sticky -mx-4 mt-6 border-t border-stone-300 bg-ivory-100 px-4 py-4 sm:mx-0 sm:rounded-md sm:border sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? <Button variant="secondary" onClick={() => goTo(step - 1)}>{copy.back}</Button> : <span />}
          <p className="hidden items-center gap-2 type-caption text-stone-600 md:flex" aria-live="polite">
            {dirty && <><Icon icon={Save} size="s" />{copy.savedNow}</>}
          </p>
          {last ? (
            <Button variant="primary" arrow loading={busy} onClick={() => void submit()}>{copy.submit}</Button>
          ) : (
            <Button variant="primary" arrow onClick={next}>{copy.next}</Button>
          )}
        </div>
      </div>
      {dirty && (
        <p className="mt-4 type-caption text-stone-600">
          <span className="md:hidden">{copy.savedNow} · </span>
          <Button variant="link" className="type-caption" onClick={onRestart}>{copy.restart}</Button>
        </p>
      )}
    </div>
  );
}

interface ListingDoneProps {
  locale: Locale;
  messages: ListingClientMessages;
  result: ListingSuccess;
  topRef: RefObject<HTMLDivElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/** The confirmation: the reference, the sale the boat joins, and what happens next. */
function ListingDone({ locale, messages, result, topRef, headingRef }: ListingDoneProps) {
  const copy = messages.listing.done;
  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="rounded-md border border-stone-300 bg-white p-6 sm:p-10">
        <Icon icon={CheckCircle2} size="l" className="text-success-700" />
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 type-display-m text-navy-900 focus:outline-none">{copy.title}</h1>
        <p className="mt-4 max-w-intro type-body-l text-stone-600">{copy.text}</p>
        <p className="mt-6 type-title-m text-navy-900">
          {interpolate(copy.sale, { sale: formatSaleName(result.closingAt, locale, { inSentence: true }), closing: formatDay(result.closingAt, locale, { weekday: false }) })}
        </p>
        <p className="mt-2 type-body-s numerals text-stone-600">{interpolate(copy.reference, { reference: result.reference })}</p>
        <ol className="mt-8 flex flex-col gap-4 border-t border-stone-200 pt-6">
          {copy.next.map((line, index) => (
            <li key={line} className="flex items-baseline gap-4 type-body-m text-navy-900">
              <span className="type-num-s text-teal-700">{String(index + 1).padStart(2, "0")}</span>
              {line}
            </li>
          ))}
        </ol>
        <p className="mt-8 border-t border-stone-200 pt-4 type-caption text-stone-600">{copy.demo}</p>
      </div>
      <Link href={href(locale, "sell")} className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
        <ButtonContent>{copy.back}</ButtonContent>
      </Link>
    </div>
  );
}
