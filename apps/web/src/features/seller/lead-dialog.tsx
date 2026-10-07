"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { LeadIntent, LeadResult } from "@bba/contracts";
import { formatLength, formatMoney, interpolate } from "@bba/i18n";
import { Button, Checkbox, Dialog, Field, Icon, TextInput } from "@bba/ui";
import { useLiveAuction } from "@/features/live/live-auction";
import { useSellFunnel } from "./sell-funnel";

type LeadError = Extract<LeadResult, { ok: false }>["reason"];

/**
 * The seller lead dialog (C-13): sell now, receive the report, or be called back. The consent box
 * is never pre-ticked; the estimate is saved with the lead so the adviser sees the same figures.
 */
export function LeadDialog({ intent, onClose }: { intent: LeadIntent; onClose: () => void }) {
  const live = useLiveAuction();
  const { locale, messages, nextSale, estimated } = useSellFunnel();
  const copy = messages.sell.lead;
  const [form, setForm] = useState({ name: "", email: "", phone: "", consent: false });
  const [error, setError] = useState<LeadError | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { seller } = live.services();
    const estimateId = intent === "callback" ? undefined : (await seller.estimate(estimated)).id;
    const result = await seller.submitLead({
      intent,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      consent: form.consent,
      estimateId,
    });
    setBusy(false);
    if (result.ok) setReference(result.reference);
    else setError(result.reason);
  };

  const fieldError = (reason: LeadError) => (error === reason ? copy.errors[reason] : undefined);

  if (reference) {
    return (
      <Dialog open onClose={onClose} title={copy.doneTitle} closeLabel={messages.common.close}>
        <div role="status" className="flex gap-3">
          <Icon icon={CheckCircle2} size="m" className="mt-1 shrink-0 text-success-700" />
          <div className="flex flex-col gap-2">
            <p className="type-body-m text-navy-900">{copy.doneText}</p>
            {nextSale && <p className="type-body-m text-navy-900">{interpolate(copy.doneNext, { date: nextSale.date, deadline: nextSale.deadline })}</p>}
            <p className="type-body-s numerals text-stone-600">{interpolate(copy.reference, { reference })}</p>
          </div>
        </div>
        <p className="mt-6 border-t border-stone-200 pt-4 type-caption text-stone-600">{copy.demo}</p>
        <Button variant="primary" className="mt-6" onClick={onClose}>{messages.common.close}</Button>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onClose} title={copy[intent]} closeLabel={messages.common.close}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {intent !== "callback" && (
          <p className="rounded-sm bg-stone-100 px-4 py-3 type-body-s text-navy-900">
            {interpolate(copy.summary, {
              type: messages.types[estimated.boatType],
              length: formatLength(Math.round(estimated.lengthMetres * 100), locale),
              year: estimated.yearBuilt,
              value: formatMoney(estimated.valueCents, locale),
            })}
          </p>
        )}
        <Field label={copy.name} error={fieldError("name_required")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus />}
        </Field>
        <Field label={copy.email} error={fieldError("invalid_email")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />}
        </Field>
        <Field label={copy.phone} optional={intent === "callback" ? undefined : messages.common.optional} error={fieldError("phone_required")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />}
        </Field>
        <div>
          <Checkbox checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} aria-invalid={error === "consent_required" || undefined}>{copy.consent}</Checkbox>
          {error === "consent_required" && <p className="mt-hint type-body-s text-danger-700">{copy.errors.consent_required}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>{copy.submit}</Button>
        <p className="border-t border-stone-200 pt-4 type-caption text-stone-600">{copy.demo}</p>
      </form>
    </Dialog>
  );
}
