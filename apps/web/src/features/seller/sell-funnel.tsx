"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EstimateRequest, LeadIntent } from "@bba/contracts";
import { estimateHoldingCost, type HoldingCostEstimate } from "@bba/domain";
import { href, type Locale } from "@bba/i18n";
import { Button, type ButtonProps } from "@bba/ui";
import { sellPrefillQuery } from "./estimate-input";
import { LeadDialog } from "./lead-dialog";
import type { NextSubmissionSale, SellClientMessages } from "./sell-types";

interface SellFunnel {
  locale: Locale;
  messages: SellClientMessages;
  nextSale: NextSubmissionSale | null;
  currentYear: number;
  /** What the owner is typing. */
  input: EstimateRequest;
  update: (patch: Partial<EstimateRequest>) => void;
  /** The input once typing settles, and its estimate: results move only then. */
  estimated: EstimateRequest;
  estimate: HoldingCostEstimate;
  /** Opens the lead dialog: the report by e-mail or a call back. */
  openLead: (intent: LeadIntent) => void;
  /** The listing form, opened with the estimated type, length and value. */
  listingHref: string;
}

const SellFunnelContext = createContext<SellFunnel | null>(null);

/** Results follow the inputs 150 ms after the last change, so a dragged slider animates the price once. */
const SETTLE_MS = 150;

interface SellFunnelProviderProps {
  locale: Locale;
  messages: SellClientMessages;
  nextSale: NextSubmissionSale | null;
  currentYear: number;
  initialInput: EstimateRequest;
  children: ReactNode;
}

/**
 * The seller funnel of the sell page: one estimate shared by the inputs, the results and the lead
 * dialog, so a lead always carries the figures the owner saw. Figures come from the same domain
 * function the backend runs; the backend stores the estimate only when a lead is sent.
 */
export function SellFunnelProvider({ locale, messages, nextSale, currentYear, initialInput, children }: SellFunnelProviderProps) {
  const [input, setInput] = useState(initialInput);
  const [estimated, setEstimated] = useState(initialInput);
  const [lead, setLead] = useState<{ intent: LeadIntent; key: number } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setEstimated(input), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  const update = useCallback((patch: Partial<EstimateRequest>) => setInput((current) => ({ ...current, ...patch })), []);
  const openLead = useCallback((intent: LeadIntent) => setLead((current) => ({ intent, key: (current?.key ?? 0) + 1 })), []);
  const estimate = useMemo(() => estimateHoldingCost({ ...estimated, currentYear }), [estimated, currentYear]);
  const listingHref = href(locale, "sellListing", {}, sellPrefillQuery({ type: estimated.boatType, lengthMetres: estimated.lengthMetres, valueCents: estimated.valueCents }));

  const value = useMemo<SellFunnel>(
    () => ({ locale, messages, nextSale, currentYear, input, update, estimated, estimate, openLead, listingHref }),
    [locale, messages, nextSale, currentYear, input, update, estimated, estimate, openLead, listingHref],
  );

  return (
    <SellFunnelContext.Provider value={value}>
      {children}
      {lead && <LeadDialog key={lead.key} intent={lead.intent} onClose={() => setLead(null)} />}
    </SellFunnelContext.Provider>
  );
}

export function useSellFunnel(): SellFunnel {
  const funnel = useContext(SellFunnelContext);
  if (!funnel) throw new Error("useSellFunnel must be used inside a SellFunnelProvider.");
  return funnel;
}

/** A button that opens the lead dialog, usable from server-rendered sections of the sell page. */
export function LeadButton({ intent, ...props }: Omit<ButtonProps, "onClick" | "type"> & { intent: LeadIntent }) {
  const { openLead } = useSellFunnel();
  return <Button {...props} onClick={() => openLead(intent)} />;
}
