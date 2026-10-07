"use client";

import { useEffect, useState } from "react";
import { interpolate } from "@bba/i18n";
import { cx } from "@bba/ui";

export interface StoryFact {
  value: string;
  label: string;
}

interface StoryProgressProps {
  label: string;
  /** "Étape {current} sur {total}" */
  stepLabel: string;
  steps: readonly string[];
  facts: readonly StoryFact[];
  panelIds: readonly string[];
}

/**
 * H3's companion card (from 1024 px): the step in the middle of the viewport, its key figure and a
 * four-segment progress bar, then links to each step. The figure changes with the price animation.
 */
export function StoryProgress({ label, stepLabel, steps, facts, panelIds }: StoryProgressProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const panels = panelIds.map((id) => document.getElementById(id)).filter((panel): panel is HTMLElement => panel !== null);
    if (!panels.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(panels.indexOf(entry.target as HTMLElement));
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [panelIds]);

  const go = (index: number) => {
    const panel = document.getElementById(panelIds[index] ?? "");
    if (!panel) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" });
    panel.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
  };

  const fact = facts[active];
  return (
    <div className="mt-10 hidden lg:block">
      <div className="on-dark rounded-md bg-navy-900 p-8 text-ivory-100">
        <p className="type-eyebrow text-mist-300">
          {interpolate(stepLabel, { current: active + 1, total: steps.length })} · {steps[active]}
        </p>
        {fact && (
          <div key={active} className="motion-price-in mt-6">
            <p className="type-num-xl">{fact.value}</p>
            <p className="mt-2 max-w-intro type-body-m text-mist-300">{fact.label}</p>
          </div>
        )}
        <div className="mt-8 grid grid-cols-4 gap-2" aria-hidden="true">
          {steps.map((step, index) => (
            <span key={step} className={cx("h-track rounded-xs transition-colors duration-panel", index <= active ? "bg-ivory-100" : "bg-navy-700")} />
          ))}
        </div>
      </div>
      <nav aria-label={label} className="mt-6">
        <ol>
          {steps.map((step, index) => (
            <li key={step}>
              <a
                href={`#${panelIds[index]}`}
                aria-current={active === index ? "step" : undefined}
                onClick={(event) => { event.preventDefault(); go(index); }}
                className={cx(
                  "flex items-baseline gap-3 border-l-2 py-2 pl-4 type-body-m transition-colors duration-fast",
                  active === index ? "border-navy-900 font-semibold text-navy-900" : "border-stone-300 text-stone-600 hover:text-navy-900",
                )}
              >
                <span className="type-num-s">{String(index + 1).padStart(2, "0")}</span>
                {step}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
