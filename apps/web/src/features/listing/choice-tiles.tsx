"use client";

import { useId } from "react";
import { cx } from "@bba/ui";

interface ChoiceTilesProps<Value extends string> {
  legend: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Grid columns, such as "grid-cols-2 sm:grid-cols-3". */
  columns: string;
}

/** A single choice shown as tiles: native radios, so arrows move the choice and the form reads it as a group. */
export function ChoiceTiles<Value extends string>({ legend, options, value, onChange, columns }: ChoiceTilesProps<Value>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="type-label text-navy-900">{legend}</legend>
      <div className={cx("mt-2 grid gap-2", columns)}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cx(
                "relative flex min-h-input cursor-pointer items-center justify-center rounded-sm border px-3 py-2 text-center type-body-s transition-colors duration-fast",
                selected ? "border-navy-900 bg-navy-900 text-ivory-100" : "border-stone-300 bg-white text-navy-900 hover:border-navy-900",
              )}
            >
              <input type="radio" name={name} value={option.value} checked={selected} onChange={() => onChange(option.value)} className="peer sr-only" />
              <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-teal-700" />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
