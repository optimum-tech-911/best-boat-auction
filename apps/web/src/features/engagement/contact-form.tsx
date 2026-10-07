"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { ContactResult, ContactTopic } from "@bba/contracts";
import { interpolate, type Messages } from "@bba/i18n";
import { Button, Checkbox, Field, Icon, Select, TextArea, TextInput } from "@bba/ui";
import { useLiveAuction, useViewer } from "@/features/live/live-auction";

type ContactError = Extract<ContactResult, { ok: false }>["reason"];

interface ContactFormProps {
  /** The subjects offered; a single one hides the choice. */
  topics: readonly ContactTopic[];
  initialTopic?: ContactTopic;
  /** The lot the request is about, shown above the fields. */
  lot?: { id: string; label: string };
  messages: Messages["contact"];
  optional: string;
}

/**
 * A request to be contacted: a broker partnership, financing, insurance or a service. The consent
 * box is never pre-ticked; the signed-in viewer's name and address are filled in.
 */
export function ContactForm({ topics, initialTopic, lot, messages, optional }: ContactFormProps) {
  const live = useLiveAuction();
  const viewer = useViewer();
  const [form, setForm] = useState({
    topic: initialTopic && topics.includes(initialTopic) ? initialTopic : topics[0] ?? "services",
    name: viewer?.displayName ?? "",
    company: viewer?.company?.name ?? "",
    email: viewer?.email ?? "",
    phone: "",
    message: "",
    consent: false,
  });
  const [error, setError] = useState<ContactError | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const broker = form.topic === "broker";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await live.services().engagement.requestContact({
      topic: form.topic,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      company: form.company || undefined,
      message: form.message || undefined,
      lotId: lot?.id,
      consent: form.consent,
    });
    setBusy(false);
    if (result.ok) setReference(result.reference);
    else setError(result.reason);
  };

  const fieldError = (reason: ContactError) => (error === reason ? messages.errors[reason] : undefined);

  if (reference) {
    return (
      <div role="status" className="flex gap-3 rounded-md bg-success-50 p-6">
        <Icon icon={CheckCircle2} size="m" className="mt-1 shrink-0 text-success-700" />
        <div>
          <p className="type-title-m text-success-700">{messages.doneTitle}</p>
          <p className="mt-1 type-body-m text-navy-900">{messages.doneText}</p>
          <p className="mt-2 type-body-s numerals text-stone-600">{interpolate(messages.reference, { reference })}</p>
          <p className="mt-2 type-caption text-stone-600">{messages.demo}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-md border border-stone-300 bg-white p-6 lg:p-8">
      {lot && <p className="rounded-sm bg-stone-100 px-4 py-3 type-body-s text-navy-900">{lot.label}</p>}
      {topics.length > 1 && (
        <Field label={messages.topic}>
          {({ id }) => (
            <Select id={id} value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value as ContactTopic })}>
              {topics.map((topic) => <option key={topic} value={topic}>{messages.topics[topic]}</option>)}
            </Select>
          )}
        </Field>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={messages.name} error={fieldError("name_required")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}
        </Field>
        <Field label={broker ? messages.agency : messages.company} optional={broker ? undefined : optional} error={fieldError("company_required")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="organization" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />}
        </Field>
        <Field label={messages.email} error={fieldError("invalid_email")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />}
        </Field>
        <Field label={messages.phone} optional={optional}>
          {({ id }) => <TextInput id={id} type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />}
        </Field>
      </div>
      <Field label={messages.message} optional={optional}>
        {({ id }) => <TextArea id={id} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />}
      </Field>
      <div>
        <Checkbox checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} aria-invalid={error === "consent_required" || undefined}>{messages.consent}</Checkbox>
        {error === "consent_required" && <p className="mt-hint type-body-s text-danger-700">{messages.errors.consent_required}</p>}
      </div>
      <Button type="submit" variant="primary" size="lg" loading={busy} className="self-start">{messages.submit}</Button>
      <p className="border-t border-stone-200 pt-4 type-caption text-stone-600">{messages.demo}</p>
    </form>
  );
}
