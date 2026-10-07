"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { QuestionResult } from "@bba/contracts";
import type { Messages } from "@bba/i18n";
import { Button, Field, Icon, TextArea } from "@bba/ui";
import { useAuthDialog } from "@/features/account/auth-dialog";
import { useLiveAuction, useViewer } from "@/features/live/live-auction";

type QuestionError = Extract<QuestionResult, { ok: false }>["reason"];

/** Asks the seller a public question. Signed-in bidders only; the question is published with its answer. */
export function AskQuestion({ lotId, messages }: { lotId: string; messages: Messages["lotPage"]["questions"] }) {
  const live = useLiveAuction();
  const viewer = useViewer();
  const auth = useAuthDialog();
  const [text, setText] = useState("");
  const [error, setError] = useState<QuestionError | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  if (!viewer) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-stone-300 p-6">
        <p className="type-body-m text-stone-600">{messages.signIn}</p>
        <Button variant="secondary" onClick={() => auth.open()}>{messages.signInAction}</Button>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div role="status" className="flex gap-3 rounded-md bg-success-50 p-6">
        <Icon icon={CheckCircle2} size="m" className="mt-1 shrink-0 text-success-700" />
        <div>
          <p className="type-body-m text-navy-900">{messages.done}</p>
          <p className="mt-2 type-caption text-stone-600">{messages.demo}</p>
        </div>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("busy");
    const result = await live.services().engagement.askQuestion({ lotId, text });
    if (result.ok) setState("done");
    else {
      setError(result.reason);
      setState("idle");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-md border border-stone-300 bg-white p-6">
      <Field label={messages.label} hint={messages.hint} error={error ? messages.errors[error] : undefined}>
        {({ id, describedBy, invalid }) => <TextArea id={id} aria-describedby={describedBy} invalid={invalid} rows={3} value={text} onChange={(event) => setText(event.target.value)} />}
      </Field>
      <Button type="submit" variant="primary" loading={state === "busy"} className="self-start">{messages.submit}</Button>
    </form>
  );
}
