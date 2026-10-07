import type { ComponentType, ReactNode } from "react";
import { cx } from "./primitives";
import { tabClasses } from "./tab-styles";

export interface TabLink {
  href: string;
  label: ReactNode;
  count?: number;
  current: boolean;
}

interface TabNavProps {
  label: string;
  items: readonly TabLink[];
  /** The router's link component, for example Next.js Link. */
  linkComponent?: ComponentType<{ href: string; className?: string; "aria-current"?: "page"; children: ReactNode }> | "a";
  className?: string;
}

/** C-16 page tabs: C-03 tabs that are links, with counts ("En cours (12)"). */
export function TabNav({ label, items, linkComponent: LinkComponent = "a", className }: TabNavProps) {
  return (
    <nav aria-label={label} className={cx("flex gap-6 overflow-x-auto border-b border-stone-200 scrollbar-none", className)}>
      {items.map((item) => (
        <LinkComponent key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} className={tabClasses(item.current, "default")}>
          {item.label}
          {item.count !== undefined && <span className="type-num-s">({item.count})</span>}
        </LinkComponent>
      ))}
    </nav>
  );
}
