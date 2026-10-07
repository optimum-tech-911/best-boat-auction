import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "@bba/ui";

export interface SpecRow {
  label: string;
  value: ReactNode;
}

/**
 * C-22 spec list: two-column rows, the label in body-s stone-600 (40 %) and the value in body-m
 * navy (60 %), with 1 px dividers and a title-m group header. Equipment without a value is listed
 * with a check mark.
 */
export function SpecList({ title, rows = [], items = [] }: { title: string; rows?: readonly SpecRow[]; items?: readonly string[] }) {
  if (!rows.length && !items.length) return null;
  return (
    <section className="break-inside-avoid">
      <h3 className="border-b border-stone-300 pb-2 type-title-m text-navy-900">{title}</h3>
      <dl className="divide-y divide-stone-200">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-5 gap-4 py-3">
            <dt className="col-span-2 type-body-s text-stone-600">{row.label}</dt>
            <dd className="col-span-3 type-body-m text-navy-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      {items.length > 0 && (
        <ul className="divide-y divide-stone-200 border-t border-stone-200">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3 py-3 type-body-m text-navy-900">
              <Icon icon={Check} size="s" className="shrink-0 text-navy-900" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
