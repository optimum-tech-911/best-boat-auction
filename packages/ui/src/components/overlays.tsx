"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx, Icon } from "./primitives";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  closeLabel: string;
  /** 560 px (md) or 720 px (lg) wide from 768 px; a bottom sheet below. */
  size?: "md" | "lg";
  /** Right-aligned actions, secondary before primary. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * C-13 dialog on the native <dialog> element: focus stays inside, the page behind is inert,
 * Escape closes it and focus returns to the control that opened it. Under 768 px it becomes a
 * full-width bottom sheet with radius-l top corners and at most 92svh.
 */
export function Dialog({ open, onClose, title, closeLabel, size = "md", actions, children }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="bba-dialog fixed inset-0 z-dialog m-0 flex h-full w-full items-end justify-center bg-transparent p-0 md:items-center md:p-6"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="motion-scrim-in absolute inset-0 bg-navy-950/60" onClick={onClose} aria-hidden="true" />
      <div
        className={cx(
          "motion-dialog-panel relative flex max-h-sheet w-full flex-col overflow-y-auto rounded-t-lg bg-white p-6 shadow-dialog md:rounded-lg md:p-8",
          size === "md" ? "md:max-w-dialog-md" : "md:max-w-dialog-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="type-title-l text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-2 -mt-2 grid size-close shrink-0 place-items-center rounded-sm text-navy-900 hover:bg-stone-100">
            <Icon icon={X} size="m" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {actions && <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>}
      </div>
    </dialog>
  );
}

export type ToastTone = "success" | "danger" | "info" | "urgent";

export interface ToastMessage {
  title: string;
  body?: string;
  tone?: ToastTone;
}

interface ToastEntry extends ToastMessage {
  id: number;
}

const ToastContext = createContext<((toast: ToastMessage) => void) | null>(null);

const toastTones: Record<ToastTone, string> = {
  success: "border-l-success-700",
  danger: "border-l-danger-700",
  info: "border-l-navy-900",
  urgent: "border-l-orange-600",
};

/**
 * C-14 toasts: 360 px, white, a 3 px left border in the status colour; top-right on desktop,
 * top-centre on mobile; dismissed after 6 s. The stack is the page's one polite live region,
 * so only meaningful changes reach it: outbid, leading, closed.
 */
export function ToastProvider({ children, dismissLabel }: { children: ReactNode; dismissLabel: string }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((toast: ToastMessage) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 4));
    window.setTimeout(() => dismiss(id), 6_000);
  }, [dismiss]);
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 top-24 z-toast flex flex-col items-center gap-3 md:inset-x-auto md:right-6 md:items-end">
        {toasts.map((toast) => (
          <div key={toast.id} className={cx("motion-toast-in pointer-events-auto flex w-full max-w-toast items-start gap-3 rounded-md border border-l-3 border-stone-300 bg-white p-4 shadow-pop", toastTones[toast.tone ?? "info"])}>
            <div className="min-w-0 flex-1">
              <p className="type-title-m text-navy-900">{toast.title}</p>
              {toast.body && <p className="mt-1 type-body-s text-stone-600">{toast.body}</p>}
            </div>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label={dismissLabel} className="-m-1 grid size-control-sm shrink-0 place-items-center rounded-sm text-stone-600 hover:text-navy-900">
              <Icon icon={X} size="s" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (toast: ToastMessage) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside a ToastProvider.");
  return show;
}
