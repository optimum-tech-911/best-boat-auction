"use client";

import { AlertCircle, Check, X } from "lucide-react";
import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { formatAmount, parseAmount, type Locale } from "@bba/i18n";
import { cx, Icon } from "./primitives";

export type FieldTone = "default" | "inverse";

interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Shown after the label, for example "(facultatif)". */
  optional?: string;
  tone?: FieldTone;
  /** Shows the value next to the label, as the slider does (num-s). */
  value?: ReactNode;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
}

/** C-02 field: label above (8 px gap), hint or error below (6 px gap), linked by aria-describedby. */
export function Field({ label, hint, error, optional, tone = "default", value, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  const muted = tone === "inverse" ? "text-mist-300" : "text-stone-600";
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={cx("type-label", tone === "inverse" ? "text-ivory-100" : "text-navy-900")}>
          {label}
          {/* Same metrics as the label, so labelled fields stay aligned side by side. */}
          {optional && <span className={muted}> ({optional})</span>}
        </label>
        {value !== undefined && <span className={cx("type-num-s", tone === "inverse" ? "text-ivory-100" : "text-navy-900")}>{value}</span>}
      </div>
      <div className="mt-2">{children({ id, describedBy, invalid: Boolean(error) })}</div>
      {error && (
        <p id={errorId} className="mt-hint flex items-start gap-2 type-body-s text-danger-700">
          <Icon icon={AlertCircle} size="s" className="mt-1 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {hint && <p id={hintId} className={cx("mt-hint type-body-s", muted)}>{hint}</p>}
    </div>
  );
}

const inputBase = "w-full rounded-sm border px-4 transition-colors duration-fast focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

function inputTone(tone: FieldTone, invalid: boolean): string {
  if (invalid) return "border-danger-700 bg-white text-navy-900";
  return tone === "inverse"
    ? "border-ivory-100/48 bg-transparent text-ivory-100 placeholder:text-mist-300 focus:border-ivory-100"
    : "border-stone-300 bg-white text-navy-900 placeholder:text-stone-600 focus:border-teal-700";
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  tone?: FieldTone;
  invalid?: boolean;
}

/** C-02 text input: 48 px, white, 1 px stone-300, radius-s, body-m. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({ tone = "default", invalid = false, className, ...props }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, "h-input type-body-m", inputTone(tone, invalid), className)} {...props} />;
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: FieldTone;
  invalid?: boolean;
}

/** C-02 multi-line input: the text input's style, four lines high by default, resizable vertically. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ tone = "default", invalid = false, rows = 4, className, ...props }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined} className={cx(inputBase, "resize-y py-3 type-body-m", inputTone(tone, invalid), className)} {...props} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  tone?: FieldTone;
  invalid?: boolean;
  /** 36 px, for toolbars such as the catalogue sort. */
  compact?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ tone = "default", invalid = false, compact = false, className, children, ...props }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, compact ? "h-control-sm w-auto type-body-s" : "h-input type-body-m", inputTone(tone, invalid), tone === "inverse" && "scheme-dark", className)} {...props}>
      {children}
    </select>
  );
});

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size" | "type"> {
  locale: Locale;
  /** Whole euros, in cents; null when empty. */
  value: number | null;
  onValueChange: (cents: number | null) => void;
  /** The bid input is 56 px with its value in num-l. */
  size?: "default" | "bid";
  tone?: FieldTone;
  invalid?: boolean;
  maximumCents?: number;
}

/**
 * C-02 money input: whole euros, tabular numerals, thousands separators while typing and
 * the currency symbol placed by language (fr "60 000 €", en "€60,000").
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { locale, value, onValueChange, size = "default", tone = "default", invalid = false, maximumCents = 5_000_000_000, className, id, ...props },
  forwardedRef,
) {
  const input = useRef<HTMLInputElement | null>(null);
  const caretDigits = useRef<number | null>(null);
  const display = value === null ? "" : formatAmount(value, locale);

  // Keep the caret after the same digit when grouping separators are inserted or removed.
  useLayoutEffect(() => {
    const element = input.current;
    const digits = caretDigits.current;
    if (!element || digits === null || document.activeElement !== element) return;
    let position = 0;
    for (let seen = 0; position < display.length && seen < digits; position += 1) if (/\d/.test(display[position] ?? "")) seen += 1;
    element.setSelectionRange(position, position);
    caretDigits.current = null;
  }, [display]);

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: typed, selectionStart } = event.target;
    caretDigits.current = typed.slice(0, selectionStart ?? typed.length).replace(/\D/g, "").length;
    const cents = typed.replace(/\D/g, "") ? Math.min(maximumCents, parseAmount(typed)) : null;
    onValueChange(cents);
  };

  const symbol = <span aria-hidden="true" className={tone === "inverse" ? "text-mist-300" : "text-stone-600"}>€</span>;
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-sm border px-4 transition-colors duration-fast focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700",
        size === "bid" ? "h-input-bid" : "h-input",
        inputTone(tone, invalid),
        className,
      )}
    >
      {locale === "en" && symbol}
      <input
        ref={(element) => {
          input.current = element;
          if (typeof forwardedRef === "function") forwardedRef(element);
          else if (forwardedRef) forwardedRef.current = element;
        }}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        value={display}
        onChange={change}
        className={cx("w-full min-w-0 bg-transparent focus:outline-none", size === "bid" ? "type-num-l" : "type-body-m numerals")}
        {...props}
      />
      {locale === "fr" && symbol}
    </div>
  );
});

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  children: ReactNode;
  tone?: FieldTone;
}

/** C-04 checkbox: 20 px, radius-xs, navy-900 when checked with an ivory mark. */
export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox({ children, tone = "default", className, ...props }, ref) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 type-body-s", tone === "inverse" ? "text-ivory-100" : "text-navy-900", className)}>
      <span className="relative mt-hairline flex size-icon-m shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className="peer size-icon-m cursor-pointer appearance-none rounded-xs border border-stone-300 bg-white checked:border-navy-900 checked:bg-navy-900"
          {...props}
        />
        <Icon icon={Check} size="s" className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-ivory-100 peer-checked:block" />
      </span>
      <span>{children}</span>
    </label>
  );
});

/** C-04 radio: 20 px, navy-900 when selected. */
export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(function Radio({ children, tone = "default", className, ...props }, ref) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 type-body-s", tone === "inverse" ? "text-ivory-100" : "text-navy-900", className)}>
      <span className="relative mt-hairline flex size-icon-m shrink-0">
        <input ref={ref} type="radio" className="peer size-icon-m cursor-pointer appearance-none rounded-full border border-stone-300 bg-white checked:border-navy-900" {...props} />
        <span className="pointer-events-none absolute left-1/2 top-1/2 hidden size-dot -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-900 peer-checked:block" />
      </span>
      <span>{children}</span>
    </label>
  );
});

interface FilterChipProps extends Omit<InputHTMLAttributes<HTMLButtonElement>, "type" | "onChange"> {
  selected?: boolean;
  count?: number;
  /** Active-filter chips show a × and remove their filter. */
  removable?: boolean;
  removeLabel?: string;
  onClick?: () => void;
  children: ReactNode;
}

/** C-05 filter chip: 36 px, radius-s; selected chips are navy-900 with ivory text. */
export function FilterChip({ selected = false, count, removable = false, removeLabel, onClick, children, className, disabled }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={removable ? undefined : selected}
      aria-label={removable && removeLabel ? removeLabel : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex h-control-sm items-center gap-2 rounded-sm border px-chip type-body-s transition-colors duration-fast disabled:opacity-40",
        selected || removable ? "border-navy-900 bg-navy-900 text-ivory-100" : "border-stone-300 text-navy-900 hover:border-navy-900",
        className,
      )}
    >
      <span>{children}</span>
      {count !== undefined && <span className={cx("type-num-s", selected || removable ? "text-mist-300" : "text-stone-600")}>{count}</span>}
      {removable && <Icon icon={X} size="s" />}
    </button>
  );
}

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step"> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

/** C-26 slider: 4 px stone-200 track with a navy-900 fill and a 20 px white thumb. */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider({ value, min, max, step = 1, onValueChange, className, ...props }, ref) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
      className={cx("bba-slider", className)}
      style={{ "--slider-fill": `${Math.min(100, Math.max(0, fill))}%` } as CSSProperties}
      {...props}
    />
  );
});
