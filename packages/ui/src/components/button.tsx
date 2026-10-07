import { ArrowRight, type LucideIcon } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx, Icon, Spinner } from "./primitives";

export type ButtonVariant = "primary" | "primary-inverse" | "bid" | "secondary" | "secondary-inverse" | "link" | "destructive";
export type ButtonSize = "lg" | "md" | "sm";

const sizes: Record<ButtonSize, string> = {
  lg: "min-h-control-lg px-button-lg type-button-lg",
  md: "min-h-control-md px-5 type-button-md",
  sm: "min-h-control-sm px-button-sm type-button-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-navy-900 text-ivory-100 hover:bg-navy-700",
  "primary-inverse": "on-dark bg-ivory-100 text-navy-900 hover:bg-white",
  bid: "bg-teal-700 text-white hover:bg-teal-800",
  secondary: "border border-stone-300 text-navy-900 hover:border-navy-900",
  "secondary-inverse": "on-dark border border-ivory-100/48 text-ivory-100 hover:border-ivory-100",
  link: "text-teal-700 hover:underline underline-offset-3",
  destructive: "border border-danger-700 text-danger-700",
};

/**
 * C-01 classes, for links styled as buttons: <Link className={buttonClasses({ variant: "primary" })}>.
 * Labels stay on one line, except in full-width buttons, which cannot grow and wrap instead.
 */
export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className }: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}): string {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-sm text-center transition-colors duration-fast",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    variant === "link" ? "type-button-md min-h-control-md" : sizes[size],
    variants[variant],
    fullWidth ? "w-full py-3" : "whitespace-nowrap",
    className,
  );
}

interface ButtonContentProps {
  children: ReactNode;
  icon?: LucideIcon;
  /** A trailing arrow that nudges 4 px on hover (animation 4). */
  arrow?: boolean;
  loading?: boolean;
  size?: ButtonSize;
}

/** The label, icon, arrow and loading spinner of a button or button-styled link. */
export function ButtonContent({ children, icon, arrow = false, loading = false, size = "md" }: ButtonContentProps) {
  const iconSize = size === "sm" ? "s" : "m";
  return (
    <>
      {loading ? <Spinner /> : icon ? <Icon icon={icon} size={iconSize} /> : null}
      <span>{children}</span>
      {arrow && <Icon icon={ArrowRight} size={iconSize} className="motion-arrow" />}
    </>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  arrow?: boolean;
  /** Keeps the label and width; the spinner replaces the icon and the button is busy. */
  loading?: boolean;
  fullWidth?: boolean;
}

/** C-01 Button. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, arrow, loading = false, fullWidth, className, children, type = "button", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      <ButtonContent icon={icon} arrow={arrow} loading={loading} size={size}>{children}</ButtonContent>
    </button>
  );
});
