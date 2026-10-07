"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./primitives";
import { tabClasses, type TabsTone } from "./tab-styles";

export interface SegmentOption<Value extends string> {
  value: Value;
  label: ReactNode;
  count?: number;
}

interface SegmentedControlProps<Value extends string> {
  label: string;
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  tone?: TabsTone;
  className?: string;
}

/**
 * C-03 segmented control: text tabs 44 px high, the active one navy-900 with a 2 px teal-700
 * underline. A radio group under the hood, moved with the arrow keys.
 */
export function SegmentedControl<Value extends string>({ label, options, value, onChange, tone = "default", className }: SegmentedControlProps<Value>) {
  const group = useRef<HTMLDivElement>(null);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!offset) return;
    event.preventDefault();
    const next = options[(index + offset + options.length) % options.length];
    if (!next) return;
    onChange(next.value);
    group.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[(index + offset + options.length) % options.length]?.focus();
  };
  return (
    <div ref={group} role="radiogroup" aria-label={label} className={cx("flex gap-6 border-b", tone === "inverse" ? "border-ivory-100/16" : "border-stone-200", className)}>
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
            className={tabClasses(active, tone)}
          >
            {option.label}
            {option.count !== undefined && <span className="type-num-s">({option.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanel {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  tabs: readonly TabPanel[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** C-03 tabs with panels, following the WAI-ARIA tabs pattern. */
export function Tabs({ label, tabs, value, onChange, className }: TabsProps) {
  const base = useId();
  const list = useRef<HTMLDivElement>(null);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    const next = (target + tabs.length) % tabs.length;
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.id);
    list.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };
  return (
    <div className={className}>
      <div ref={list} role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-stone-200 scrollbar-none">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${base}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === value}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={tab.id === value ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => move(event, index)}
            className={tabClasses(tab.id === value, "default")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} id={`${base}-panel-${tab.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${tab.id}`} hidden={tab.id !== value} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
