import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Reveal } from "./motion";
import { cx, Icon } from "./primitives";

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** A C-01 link, right-aligned on the title's baseline on desktop and below it on mobile. */
  action?: ReactNode;
  as?: "h1" | "h2";
  tone?: "default" | "inverse";
  /** The heading rise (M11) of editorial pages. */
  reveal?: boolean;
  className?: string;
  titleId?: string;
}

/** C-15 section header: eyebrow, a display-m title and an optional body-l intro. */
export function SectionHeader({ eyebrow, title, intro, action, as: Heading = "h2", tone = "default", reveal = false, className, titleId }: SectionHeaderProps) {
  const muted = tone === "inverse" ? "text-mist-300" : "text-stone-600";
  const text = (
    <>
      {eyebrow && <p className={cx("type-eyebrow", muted)}>{eyebrow}</p>}
      <Heading id={titleId} className={cx(Heading === "h1" ? "type-display-l" : "type-display-m", "text-balance", eyebrow ? "mt-3" : undefined, tone === "inverse" ? "text-ivory-100" : "text-navy-900")}>{title}</Heading>
      {intro && <p className={cx("mt-4 max-w-intro type-body-l", muted)}>{intro}</p>}
    </>
  );
  return (
    <div className={cx("flex flex-col gap-4 lg:flex-row lg:justify-between lg:gap-8", action ? "lg:items-end" : "lg:items-start", className)}>
      {reveal ? <Reveal kind="heading" className="min-w-0">{text}</Reveal> : <div className="min-w-0">{text}</div>}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** C-17 table: eyebrow headers over a stone-300 rule, 56 px rows, numbers right-aligned. */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cx("w-full border-collapse text-left", className)} {...props}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-stone-300">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-stone-200">{children}</tbody>;
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx("h-row-table transition-colors duration-fast hover:bg-stone-100", className)} {...props}>{children}</tr>;
}

interface CellProps {
  numeric?: boolean;
  /** Totals and other key rows: title-m instead of body-m. */
  emphasis?: boolean;
}

export function TableHeader({ numeric = false, className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return <th scope="col" className={cx("px-4 py-3 type-eyebrow text-stone-600", numeric && "text-right", className)} {...props}>{children}</th>;
}

export function TableCell({ numeric = false, emphasis = false, className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return <td className={cx("px-4 py-3 text-navy-900", emphasis ? "type-title-m" : "type-body-m", numeric && "text-right numerals", className)} {...props}>{children}</td>;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  /** Exactly one button. */
  action: ReactNode;
}

/** C-18 empty state: centred, at most 420 px wide, one action. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-empty flex-col items-center py-16 text-center">
      <Icon icon={icon} size="l" className="text-stone-600" />
      <p className="mt-4 type-display-s text-navy-900">{title}</p>
      {children && <p className="mt-3 type-body-m text-stone-600">{children}</p>}
      <div className="mt-6">{action}</div>
    </div>
  );
}

/** C-19 skeleton: a stone-100 block sized exactly like the content it stands for. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("motion-skeleton block rounded-sm bg-stone-100", className)} />;
}

/** A plain divider between rows and sections. */
export function Divider({ tone = "default", className }: { tone?: "default" | "inverse"; className?: string }) {
  return <hr className={cx("border-0 border-t", tone === "inverse" ? "border-ivory-100/16" : "border-stone-200", className)} />;
}
