"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";
import { cx, Icon } from "./primitives";

export interface LanguageOption {
  code: string;
  /** The language named in itself: "Français", "English". */
  name: string;
  href: string;
  current: boolean;
}

interface LanguageMenuProps {
  /** The button's accessible name, including the current language: "Langue : Français". */
  label: string;
  options: readonly LanguageOption[];
  tone?: "default" | "inverse";
  /** Where the menu opens: below the button (header) or above it (footer). */
  placement?: "below" | "above";
  linkComponent?: ComponentType<{ href: string; hrefLang?: string; lang?: string; "aria-current"?: "true"; className?: string; onClick?: () => void; children: ReactNode }> | "a";
}

/** C-24 language switch: the current code with a chevron; the menu names each language in itself. */
export function LanguageMenu({ label, options, tone = "default", placement = "below", linkComponent: LinkComponent = "a" }: LanguageMenuProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = options.find((option) => option.current);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cx("flex h-control-md items-center gap-1 rounded-sm px-2 type-button-sm", tone === "inverse" ? "on-dark text-ivory-100" : "text-navy-900")}
      >
        <span className="uppercase">{current?.code}</span>
        <Icon icon={ChevronDown} size="s" className={cx("transition-transform duration-base", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          id={menuId}
          className={cx(
            "motion-dialog-in absolute right-0 z-overlay w-max rounded-md border border-stone-300 bg-white p-2 shadow-pop",
            placement === "below" ? "top-full mt-2" : "bottom-full mb-2",
          )}
        >
          {options.map((option) => (
            <li key={option.code}>
              <LinkComponent
                href={option.href}
                hrefLang={option.code}
                lang={option.code}
                aria-current={option.current ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={cx("flex h-control-md items-center whitespace-nowrap rounded-sm px-4 type-body-m text-navy-900 hover:bg-stone-100", option.current && "bg-stone-100 type-title-m")}
              >
                {option.name}
              </LinkComponent>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/** Questions and answers on native disclosure elements: keyboard and screen-reader ready without script. */
export function Accordion({ items, className }: { items: readonly AccordionItem[]; className?: string }) {
  return (
    <div className={cx("divide-y divide-stone-200 border-y border-stone-200", className)}>
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="bba-summary flex min-h-control-lg cursor-pointer items-center justify-between gap-4 py-4 type-title-m text-navy-900">
            {item.title}
            <Icon icon={Plus} size="m" className="shrink-0 transition-transform duration-base group-open:rotate-45" />
          </summary>
          <div className="max-w-measure pb-6 type-body-m text-stone-600">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
