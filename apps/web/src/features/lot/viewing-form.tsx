"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { interpolate, type Messages } from "@bba/i18n";
import { Button, Field, Icon, Select, TextInput } from "@bba/ui";
import { useLiveAuction, useViewer } from "@/features/live/live-auction";

type ViewingMessages = Messages["lotPage"]["viewing"];

/** The inline viewing-day registration of the lot page: name, e-mail, optional phone and visitors. */
export function ViewingForm({ lotId, messages, optional }: { lotId: string; messages: ViewingMessages; optional: string }) {
  const live = useLiveAuction();
  const viewer = useViewer();
  const [form, setForm] = useState({ name: viewer?.displayName ?? "", email: viewer?.email ?? "", phone: "", visitors: "1" });
  const [error, setError] = useState<keyof ViewingMessages["errors"] | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("busy");
    const result = await live.services().engagement.registerViewing({ lotId, name: form.name, email: form.email, phone: form.phone || undefined, visitors: Number(form.visitors) });
    if (result.ok) setState("done");
    else {
      setError(result.reason);
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="flex gap-3 rounded-md bg-success-50 p-6 text-success-700">
        <Icon icon={CheckCircle2} size="m" className="mt-1 shrink-0" />
        <div>
          <p className="type-title-m">{messages.done}</p>
          <p className="mt-1 type-body-m text-navy-900">{interpolate(messages.doneText, { email: form.email })}</p>
          <p className="mt-2 type-caption text-stone-600">{messages.demo}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-md border border-stone-300 bg-white p-6">
      <h3 className="type-title-m text-navy-900">{messages.form}</h3>
      <Field label={messages.name} error={error === "invalid_request" ? messages.errors.invalid_request : undefined}>
        {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}
      </Field>
      <Field label={messages.email} error={error === "invalid_email" ? messages.errors.invalid_email : undefined}>
        {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={messages.phone} optional={optional}>
          {({ id }) => <TextInput id={id} type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />}
        </Field>
        <Field label={messages.visitors}>
          {({ id }) => (
            <Select id={id} value={form.visitors} onChange={(event) => setForm({ ...form, visitors: event.target.value })}>
              {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <Button type="submit" variant="primary" loading={state === "busy"} className="self-start">{messages.submit}</Button>
      <p className="type-caption text-stone-600">{messages.demo}</p>
    </form>
  );
}
