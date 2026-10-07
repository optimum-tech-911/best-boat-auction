"use client";

import { useId, useState, type FormEvent } from "react";
import type { BoatType } from "@bba/contracts";
import { interpolate, type Locale } from "@bba/i18n";
import { Button, Checkbox, cx, FilterChip, TextInput } from "@bba/ui";
import { useLiveAuction } from "@/features/live/live-auction";

export interface NewsletterMessages {
  label: string;
  placeholder: string;
  action: string;
  consent: string;
  success: string;
  demo: string;
  errors: { invalid_email: string; consent_required: string };
}

/** Alerts by boat type: the homepage version lets the visitor choose the types they follow. */
interface AlertOptions {
  legend: string;
  /** "Alerte simulée pour : {types}." */
  success: string;
  types: readonly { value: BoatType; label: string }[];
}

interface NewsletterFormProps {
  locale: Locale;
  messages: NewsletterMessages;
  variant: "home" | "footer";
  alerts?: AlertOptions;
}

/** The new-lot alerts of H9 and G2. Consent is never pre-ticked; the demonstration stores nothing. */
export function NewsletterForm({ messages, variant, alerts }: NewsletterFormProps) {
  const live = useLiveAuction();
  const inputId = useId();
  const legendId = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [types, setTypes] = useState<BoatType[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done" | keyof NewsletterMessages["errors"]>("idle");
  const inverse = variant === "footer";

  const toggle = (type: BoatType) => setTypes((current) => (current.includes(type) ? current.filter((value) => value !== type) : [...current, type]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("busy");
    const result = await live.services().engagement.subscribeNewsletter({ email, consent, ...(types.length ? { types } : {}) });
    setState(result.ok ? "done" : result.reason === "consent_required" ? "consent_required" : "invalid_email");
  };

  const chosen = alerts?.types.filter((type) => types.includes(type.value)).map((type) => type.label) ?? [];
  const success = alerts && chosen.length ? interpolate(alerts.success, { types: chosen.join(", ") }) : messages.success;
  const error = state === "invalid_email" || state === "consent_required" ? messages.errors[state] : null;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {alerts && (
        <div role="group" aria-labelledby={legendId}>
          <p id={legendId} className="type-label text-navy-900">{alerts.legend}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {alerts.types.map((type) => (
              <FilterChip key={type.value} selected={types.includes(type.value)} onClick={() => toggle(type.value)}>{type.label}</FilterChip>
            ))}
          </div>
        </div>
      )}
      <label htmlFor={inputId} className={cx("type-label", inverse ? "text-ivory-100" : "text-navy-900")}>{messages.label}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <TextInput
          id={inputId}
          type="email"
          autoComplete="email"
          tone={inverse ? "inverse" : "default"}
          invalid={state === "invalid_email"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={messages.placeholder}
          aria-describedby={`${inputId}-status`}
        />
        <Button type="submit" variant={inverse ? "primary-inverse" : "primary"} loading={state === "busy"} className="shrink-0">{messages.action}</Button>
      </div>
      <Checkbox tone={inverse ? "inverse" : "default"} checked={consent} onChange={(event) => setConsent(event.target.checked)}>
        <span className={inverse ? "text-mist-300" : "text-stone-600"}>{messages.consent}</span>
      </Checkbox>
      <p id={`${inputId}-status`} role="status" className={cx("type-caption", error ? (inverse ? "text-ivory-100" : "text-danger-700") : inverse ? "text-mist-300" : "text-stone-600")}>
        {error ?? (state === "done" ? success : messages.demo)}
      </p>
    </form>
  );
}
