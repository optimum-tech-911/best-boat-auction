"use client";

import { useEffect } from "react";
import { formatMoney, interpolate, type Locale, type Messages } from "@bba/i18n";
import { useToast } from "@bba/ui";
import { useLiveAuction } from "./live-auction";
import { ruleParams } from "@/lib/rule-params";

/**
 * Announces only what matters to the viewer, through the page's single live region (C-14):
 * outbid, kept ahead by their maximum, and the outcome when one of their lots closes.
 */
export function LiveNotifications({ locale, messages }: { locale: Locale; messages: Messages["notifications"] }) {
  const live = useLiveAuction();
  const toast = useToast();
  useEffect(() => live.onEvent((event) => {
    const price = (cents: number) => formatMoney(cents, locale);
    if (event.type === "viewer.outbid") {
      toast({ tone: "danger", title: messages.outbid, body: interpolate(messages.outbidBody, { title: event.lotTitle, price: price(event.priceCents) }) });
    } else if (event.type === "viewer.leading") {
      toast({ tone: "success", title: messages.leading, body: interpolate(messages.leadingBody, { title: event.lotTitle, price: price(event.priceCents) }) });
    } else if (event.type === "viewer.position") {
      const { status, lastBidCents } = event.position;
      const params = { title: event.lotTitle, price: price(lastBidCents) };
      if (status === "won") toast({ tone: "success", title: interpolate(messages.won, params), body: interpolate(messages.wonBody, params) });
      else if (status === "awaiting_seller") toast({ tone: "info", title: interpolate(messages.awaitingSeller, params), body: interpolate(messages.awaitingSellerBody, { ...ruleParams(locale), ...params }) });
      else if (status === "lost") toast({ tone: "info", title: interpolate(messages.lost, params), body: messages.lostBody });
    }
  }), [live, toast, locale, messages]);
  return null;
}
