import type { LucideIcon, LucideProps } from "lucide-react";
import type { ReactNode } from "react";

/** Joins class names, skipping empty values. */
export function cx(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** 16 inline, 20 in buttons and inputs, 24 in navigation; 18 for the C-10 watch heart. */
const iconSizes = { s: 16, card: 18, m: 20, l: 24 } as const;
export type IconSize = keyof typeof iconSizes;

interface IconProps extends Omit<LucideProps, "size" | "ref"> {
  icon: LucideIcon;
  size?: IconSize;
  /** Icons are decorative unless they carry a label of their own. */
  label?: string;
}

/** Lucide icons at the design system's sizes and 1.5 stroke; colour inherits from the text. */
export function Icon({ icon: Component, size = "m", label, ...props }: IconProps) {
  return <Component size={iconSizes[size]} strokeWidth={1.5} aria-hidden={label ? undefined : true} aria-label={label} focusable={false} {...props} />;
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/** The 16 px loading indicator that replaces a button's icon. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("size-icon-s animate-spin", className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
