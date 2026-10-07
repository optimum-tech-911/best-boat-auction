"use client";

import { AlertTriangle, BadgeCheck } from "lucide-react";
import { useState } from "react";
import type { LotDetail } from "@bba/contracts";
import { buyerTotal, defaultAuctionRules, type BidKind } from "@bba/domain";
import { formatDateShort, formatMoney, formatPercent, interpolate, type Locale } from "@bba/i18n";
import { Button, Checkbox, Dialog, Icon, PriceBreakdownDiagram, useToast } from "@bba/ui";
import { LotPhoto } from "@/components/auction/lot-photo";
import { useLiveAuction, useViewer } from "@/features/live/live-auction";
import type { BidMessages } from "./bid-messages";

interface ReviewDialogProps {
  lot: LotDetail;
  kind: BidKind;
  amountCents: number;
  minimumCents: number;
  endsAt: number;
  locale: Locale;
  messages: BidMessages;
  onClose: () => void;
  onPlaced: () => void;
}

/**
 * The review before a binding bid (BID): the lot, the full cost if the bid wins, the sale's binding
 * consent (never pre-ticked), a warning far above the minimum and, from 25 000 €, the identity check.
 */
export function ReviewDialog({ lot, kind, amountCents, minimumCents, endsAt, locale, messages, onClose, onPlaced }: ReviewDialogProps) {
  const live = useLiveAuction();
  const viewer = useViewer();
  const toast = useToast();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = messages.bid.review;
  const rules = { ...defaultAuctionRules, vatOnPremium: lot.conditions.vatOnPremium };
  const cost = buyerTotal({ hammerCents: amountCents, startCents: lot.startCents, vatOnHammer: lot.conditions.vatOnHammer }, rules);
  const money = (cents: number) => formatMoney(cents, locale, { withCents: true });
  const needsIdentity = amountCents >= rules.idCheckFromCents && !viewer?.identityVerified;
  // The interface asks for a second look at twice the next minimum.
  const high = amountCents >= minimumCents * rules.confirmationMultiplier;
  const amount = formatMoney(amountCents, locale);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const result = await live.placeBid({ lotId: lot.id, kind, amountCents });
    setBusy(false);
    if (!result.ok) {
      setError(interpolate(messages.errors[result.code], { minimum: formatMoney(result.minimumCents ?? minimumCents, locale) }));
      return;
    }
    const params = { amount, title: lot.title, price: formatMoney(result.state.priceCents ?? amountCents, locale) };
    const notes = messages.notifications;
    if (result.position.status === "leading") {
      toast({ tone: "success", title: interpolate(kind === "max" ? notes.maxPlaced : notes.bidPlaced, params), body: interpolate(kind === "max" ? notes.maxPlacedBody : notes.bidPlacedBody, params) });
    } else {
      toast({ tone: "danger", title: notes.outbidInstantly, body: interpolate(notes.outbidInstantlyBody, params) });
    }
    onPlaced();
  };

  const rows: [string, string][] = [
    [kind === "max" ? copy.yourMax : copy.yourBid, money(cost.hammerCents)],
    [copy.vatOnPrice, money(cost.vatOnHammerCents)],
    [interpolate(copy.premium, { rate: formatPercent(cost.premiumRate, locale) }), money(cost.premiumCents)],
    [interpolate(copy.vatOnPremium, { rate: formatPercent(cost.vatOnPremium, locale) }), money(cost.vatOnPremiumCents)],
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      title={kind === "max" ? copy.maxTitle : copy.title}
      closeLabel={messages.close}
      actions={!needsIdentity && (
        <>
          <Button variant="secondary" onClick={onClose}>{copy.edit}</Button>
          <Button variant="bid" disabled={!consent} loading={busy} onClick={confirm}>{interpolate(kind === "max" ? copy.confirmMax : copy.confirmSingle, { amount })}</Button>
        </>
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-thumb-h w-thumb-w shrink-0 overflow-hidden rounded-sm bg-stone-100">
          <LotPhoto image={lot.cover} locale={locale} sizes="96px" placeholder="" decorative />
        </div>
        <div className="min-w-0">
          <p className="truncate type-title-m text-navy-900">{lot.title}</p>
          <p className="type-body-s text-stone-600">{interpolate(messages.lot.lotNumber, { number: lot.number })} · {formatDateShort(endsAt, locale)}</p>
        </div>
      </div>

      {needsIdentity ? (
        <IdentityStep messages={messages} />
      ) : (
        <>
          <table className="mt-6 w-full">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" className="py-2 text-left type-body-m font-normal text-stone-600">{label}</th>
                  <td className="py-2 text-right type-num-s text-navy-900">{value}</td>
                </tr>
              ))}
              <tr className="border-t border-stone-300">
                <th scope="row" className="pt-3 text-left type-title-m text-navy-900">{kind === "max" ? copy.totalMax : copy.total}</th>
                <td className="pt-3 text-right type-title-m numerals text-navy-900">{money(cost.totalCents)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6">
            <PriceBreakdownDiagram
              title={messages.price.title}
              segments={[
                { label: messages.price.bid, value: cost.hammerCents + cost.vatOnHammerCents, display: formatMoney(cost.hammerCents + cost.vatOnHammerCents, locale) },
                { label: messages.price.premium, value: cost.premiumCents, display: formatMoney(cost.premiumCents, locale) },
                { label: messages.price.vat, value: cost.vatOnPremiumCents, display: formatMoney(cost.vatOnPremiumCents, locale) },
              ]}
              total={{ label: messages.price.total, display: formatMoney(cost.totalCents, locale) }}
            />
          </div>
          {kind === "max" && <p className="mt-4 type-body-s text-stone-600">{copy.maxNote}</p>}
          {high && (
            <p role="alert" className="mt-4 flex gap-3 rounded-sm bg-danger-50 p-4 type-body-s text-danger-700">
              <Icon icon={AlertTriangle} size="s" className="mt-1 shrink-0" />
              {interpolate(copy.high, { minimum: formatMoney(minimumCents, locale) })}
            </p>
          )}
          <Checkbox className="mt-6" checked={consent} onChange={(event) => setConsent(event.target.checked)}>
            {lot.conditions.mode === "brokerage" ? interpolate(copy.consentBrokerage, { hours: lot.conditions.sellerDecisionHours }) : copy.consent}
          </Checkbox>
          {error && <p role="alert" className="mt-4 rounded-sm bg-danger-50 p-4 type-body-s text-danger-700">{error}</p>}
          <p className="mt-4 type-caption text-stone-600">{copy.demo}</p>
        </>
      )}
    </Dialog>
  );
}

function IdentityStep({ messages }: { messages: BidMessages }) {
  const live = useLiveAuction();
  const [busy, setBusy] = useState(false);
  const copy = messages.bid.identity;
  const verify = async () => {
    setBusy(true);
    await live.verifyIdentity();
    setBusy(false);
  };
  return (
    <div className="mt-6 rounded-md border border-stone-300 p-6">
      <p className="flex items-center gap-3 type-title-m text-navy-900"><Icon icon={BadgeCheck} size="m" />{copy.title}</p>
      <p className="mt-2 type-body-m text-stone-600">{copy.text}</p>
      <Button variant="primary" className="mt-4" loading={busy} onClick={verify}>{copy.action}</Button>
      <p className="mt-3 type-caption text-stone-600">{copy.demo}</p>
    </div>
  );
}
