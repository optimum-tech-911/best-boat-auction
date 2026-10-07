"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney, interpolate } from "@bba/i18n";
import { cx, Icon } from "@bba/ui";
import { useSellFunnel } from "./sell-funnel";
import { estimatorIds } from "./sell-types";

/**
 * Under 1024 px the results follow a long form. While the owner is answering and the results are
 * off screen, this bar keeps the monthly cost in view; tapping it scrolls to the full results.
 */
export function MobileEstimateBar() {
  const { locale, messages, estimate } = useSellFunnel();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inputs = document.getElementById(estimatorIds.inputs);
    const results = document.getElementById(estimatorIds.results);
    if (!inputs || !results) return;
    const seen = { inputs: false, results: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) seen[entry.target === inputs ? "inputs" : "results"] = entry.isIntersecting;
      setVisible(seen.inputs && !seen.results);
    });
    observer.observe(inputs);
    observer.observe(results);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      href={`#${estimatorIds.results}`}
      inert={!visible}
      className={cx(
        "on-dark fixed inset-x-0 bottom-0 z-sticky flex h-bar-mobile items-center bg-navy-900 text-ivory-100 transition-transform duration-base lg:hidden",
        !visible && "translate-y-full",
      )}
    >
      <span className="page-container flex w-full items-center justify-between gap-4">
        <span className="type-body-s text-mist-300">{messages.sell.result.short}</span>
        <span className="flex items-center gap-2">
          <span key={estimate.monthlyCents} className="motion-price-in whitespace-nowrap type-num-m">{interpolate(messages.sell.result.monthly, { value: formatMoney(estimate.monthlyCents, locale) })}</span>
          <Icon icon={ChevronDown} size="s" />
        </span>
      </span>
    </a>
  );
}
