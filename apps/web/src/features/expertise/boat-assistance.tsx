"use client";

import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { interpolate, type Messages } from "@bba/i18n";
import { demoBoatExpert } from "@bba/sdk";
import { Button, Dialog, ExpertiseButtons, Field, Icon, TextInput } from "@bba/ui";

type Mode = "digital" | "physical";
type AssistanceRequest = { lotId: string; title: string; mode: Mode };
type ExpertiseCopy = Messages["assistance"]["expertise"];

const AssistanceContext = createContext<{ open: (request: AssistanceRequest) => void; copy: ExpertiseCopy } | null>(null);

/** One dialog per page tree, even when many cards offer assistance. Everything stays in memory. */
export function BoatAssistanceProvider({ copy, closeLabel, children }: { copy: ExpertiseCopy; closeLabel: string; children: ReactNode }) {
  const [request, setRequest] = useState<AssistanceRequest | null>(null);
  return (
    <AssistanceContext.Provider value={{ open: setRequest, copy }}>
      {children}
      {request && <AssistanceDialog key={`${request.lotId}-${request.mode}`} request={request} copy={copy} closeLabel={closeLabel} onClose={() => setRequest(null)} />}
    </AssistanceContext.Provider>
  );
}

export function ExpertiseActions({ lotId, title, compact = false }: { lotId: string; title: string; compact?: boolean }) {
  const context = useContext(AssistanceContext);
  if (!context) throw new Error("ExpertiseActions needs BoatAssistanceProvider.");
  const { open, copy } = context;
  return (
    <div data-expertise-actions className="relative z-raised">
      <p className="mb-2 type-caption text-stone-600">{copy.label}</p>
      <ExpertiseButtons
        label={interpolate(copy.forBoat, { service: copy.label, boat: title })}
        digital={compact ? copy.digitalShort : copy.digital}
        physical={compact ? copy.physicalShort : copy.physical}
        digitalAccessibleLabel={interpolate(copy.forBoat, { service: copy.digital, boat: title })}
        physicalAccessibleLabel={interpolate(copy.forBoat, { service: copy.physical, boat: title })}
        compact={compact}
        onDigital={() => open({ lotId, title, mode: "digital" })}
        onPhysical={() => open({ lotId, title, mode: "physical" })}
      />
    </div>
  );
}

function AssistanceDialog({ request, copy, closeLabel, onClose }: { request: AssistanceRequest; copy: ExpertiseCopy; closeLabel: string; onClose: () => void }) {
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<readonly { question: string; reply: string }[]>([]);
  const digital = request.mode === "digital";
  const checks = digital ? copy.digitalChecks : copy.physicalChecks;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setConversation((current) => [...current, { question: trimmed, reply: copy.reply }]);
    setQuestion("");
  };
  return (
    <Dialog open onClose={onClose} title={digital ? copy.digitalTitle : copy.physicalTitle} closeLabel={closeLabel}>
      <p className="type-title-m text-navy-900">{request.title}</p>
      <p className="mt-2 type-body-m text-stone-600">{digital ? copy.digitalIntro : copy.physicalIntro}</p>
      <div className="mt-5 flex items-center gap-3 border-y border-stone-200 py-4">
        <span aria-hidden="true" className="grid size-avatar shrink-0 place-items-center rounded-full bg-navy-900 type-caption text-ivory-100">{demoBoatExpert.initials}</span>
        <div><p className="type-title-m text-navy-900">{demoBoatExpert.name}</p><p className="type-body-s text-stone-600">{copy.expertRole}</p></div>
      </div>
      {started ? (
        <>
          <p className="mt-5 type-eyebrow text-stone-600">{copy.session}</p>
          <div role="log" aria-live="polite" aria-relevant="additions" className="mt-3 flex max-h-menu flex-col gap-3 overflow-y-auto">
            <p className="rounded-md bg-stone-100 p-4 type-body-s text-navy-900">{interpolate(digital ? copy.digitalWelcome : copy.physicalWelcome, { boat: request.title })}</p>
            {conversation.map((entry, index) => <div key={index} className="flex flex-col gap-3">
              <div className="rounded-md border border-stone-300 p-4"><p className="type-caption text-stone-600">{copy.you}</p><p className="mt-1 break-words type-body-s text-navy-900">{entry.question}</p></div>
              <div className="rounded-md bg-stone-100 p-4"><p className="type-caption text-stone-600">{demoBoatExpert.name}</p><p className="mt-1 type-body-s text-navy-900">{entry.reply}</p></div>
            </div>)}
          </div>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            <Field label={copy.question}>{({ id }) => <TextInput id={id} value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder={copy.placeholder} autoFocus />}</Field>
            <Button type="submit" disabled={!question.trim()} className="self-end">{copy.send}</Button>
          </form>
        </>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">{checks.map((check) => <li key={check} className="flex gap-3 type-body-s text-navy-900"><Icon icon={Check} size="m" className="shrink-0" />{check}</li>)}</ul>
          <Button onClick={() => setStarted(true)} arrow fullWidth className="mt-6">{copy.start}</Button>
        </>
      )}
      <p className="mt-5 border-t border-stone-200 pt-4 type-caption text-stone-600">{copy.demo}</p>
    </Dialog>
  );
}
