import type { ReactNode } from "react";

/** The dark call-to-action band that closes an editorial page: navy-900, a display-m title and its actions. */
export function CtaBand({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="on-dark bg-navy-900 text-ivory-100">
      <div className="page-container flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <h2 id={id} className="max-w-intro type-display-m text-balance">{title}</h2>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">{children}</div>
      </div>
    </section>
  );
}
