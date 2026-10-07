"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Messages } from "@bba/i18n";
import { demoScenarios, type DemoScenario } from "@bba/sdk";
import { cx, Dialog } from "@bba/ui";
import { DEMO_CLOCK_COOKIE, DEMO_STORAGE_KEY, DEMO_VIEWER_COOKIE } from "@/lib/demo-session";

interface DemoBarProps {
  messages: { demo: Messages["demo"]; common: Messages["common"] };
  scenario: DemoScenario | null;
}

/**
 * The demonstration notice (G0-9): one discreet bar on every page. With ?preview=1, or while a
 * scenario is active, it also moves the demonstration clock to a moment of the sale.
 */
export function DemoBar(props: DemoBarProps) {
  return (
    <Suspense fallback={<DemoBarContent {...props} preview={false} path="/" />}>
      <DemoBarWithPreview {...props} />
    </Suspense>
  );
}

function DemoBarWithPreview(props: DemoBarProps) {
  const search = useSearchParams();
  const pathname = usePathname();
  const preview = search.get("preview") === "1" || props.scenario !== null;
  return <DemoBarContent {...props} preview={preview} path={`${pathname}${search.size ? `?${search.toString()}` : ""}`} />;
}

/** Forgets the demonstration's bids, account, watchlist and clock in this browser, then reloads. */
function resetDemonstration() {
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was kept.
  }
  for (const name of [DEMO_VIEWER_COOKIE, DEMO_CLOCK_COOKIE]) document.cookie = `${name}=; path=/; samesite=lax; max-age=0`;
  window.location.reload();
}

function DemoBarContent({ messages, scenario, preview, path }: DemoBarProps & { preview: boolean; path: string }) {
  const { demo, common } = messages;
  const [about, setAbout] = useState(false);
  const link = (value: DemoScenario | "real") => `/api/demo?scenario=${value}&redirect=${encodeURIComponent(path)}`;
  return (
    <aside aria-label={demo.previewTitle} className="border-b border-stone-200 bg-stone-100">
      <div className="page-container flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 type-caption text-stone-600">
        <p>{demo.bar}</p>
        {preview && (
          <nav aria-label={demo.clock} className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-navy-900">{demo.clock} :</span>
            {demoScenarios.map((value) => (
              <a key={value} href={link(value)} aria-current={scenario === value ? "true" : undefined} className={cx("hover:text-navy-900 hover:underline underline-offset-3", scenario === value && "text-navy-900 underline")}>
                {demo.scenarios[value]}
              </a>
            ))}
            <a href={link("real")} aria-current={scenario === null ? "true" : undefined} className={cx("hover:text-navy-900 hover:underline underline-offset-3", scenario === null && "text-navy-900 underline")}>{demo.realTime}</a>
            <button type="button" onClick={resetDemonstration} className="text-navy-900 hover:underline underline-offset-3">{demo.reset}</button>
          </nav>
        )}
        <button type="button" onClick={() => setAbout(true)} className="text-teal-700 hover:underline underline-offset-3">{demo.details}</button>
      </div>
      <Dialog open={about} onClose={() => setAbout(false)} title={demo.aboutTitle} closeLabel={common.close}>
        <div className="flex flex-col gap-4 type-body-m text-stone-600">
          {demo.aboutBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </Dialog>
    </aside>
  );
}
