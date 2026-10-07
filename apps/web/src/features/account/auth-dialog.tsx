"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Messages } from "@bba/i18n";
import { Button, Checkbox, Dialog, Field, TextInput } from "@bba/ui";
import { useLiveAuction } from "@/features/live/live-auction";

interface AuthDialogApi {
  /** Opens sign-in; `then` runs once the viewer is signed in, for example to resume a bid. */
  open(then?: () => void): void;
}

const AuthDialogContext = createContext<AuthDialogApi | null>(null);

export interface AuthMessages {
  auth: Messages["auth"];
  common: Messages["common"];
}

/** One sign-in dialog for the whole site: the header, the bid panel and the account pages open it. */
export function AuthDialogProvider({ messages, children }: { messages: AuthMessages; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const after = useRef<(() => void) | undefined>(undefined);
  const api = useMemo<AuthDialogApi>(() => ({
    open(then) {
      after.current = then;
      setOpen(true);
    },
  }), []);
  const close = useCallback(() => {
    after.current = undefined;
    setOpen(false);
  }, []);
  const done = useCallback(() => {
    const then = after.current;
    after.current = undefined;
    setOpen(false);
    if (then) window.setTimeout(then, 0);
  }, []);
  return (
    <AuthDialogContext.Provider value={api}>
      {children}
      {open && <AuthForm messages={messages} onClose={close} onDone={done} />}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog(): AuthDialogApi {
  const api = useContext(AuthDialogContext);
  if (!api) throw new Error("useAuthDialog must be used inside an AuthDialogProvider.");
  return api;
}

function AuthForm({ messages, onClose, onDone }: { messages: AuthMessages; onClose: () => void; onDone: () => void }) {
  const { auth, common } = messages;
  const live = useLiveAuction();
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<keyof Messages["auth"]["errors"] | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await live.signIn(mode === "signUp" ? { email, displayName: name, acceptTerms: terms } : { email });
    setBusy(false);
    if (result.ok) onDone();
    else setError(result.reason);
  };

  return (
    <Dialog open onClose={onClose} title={mode === "signUp" ? auth.signUpTitle : auth.signInTitle} closeLabel={common.close}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <p className="type-body-m text-stone-600">{auth.intro}</p>
        {mode === "signUp" && (
          <Field label={auth.name} error={error === "name_required" ? auth.errors.name_required : undefined}>
            {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />}
          </Field>
        )}
        <Field label={auth.email} error={error === "invalid_email" ? auth.errors.invalid_email : undefined}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus={mode === "signIn"} />}
        </Field>
        {mode === "signUp" && (
          <div>
            <Checkbox checked={terms} onChange={(event) => setTerms(event.target.checked)} aria-invalid={error === "terms_required" || undefined}>{auth.terms}</Checkbox>
            {error === "terms_required" && <p className="mt-hint type-body-s text-danger-700">{auth.errors.terms_required}</p>}
          </div>
        )}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>{mode === "signUp" ? auth.signUp : auth.signIn}</Button>
        <button type="button" onClick={() => { setMode(mode === "signUp" ? "signIn" : "signUp"); setError(null); }} className="self-center type-body-s text-teal-700 hover:underline underline-offset-3">
          {mode === "signUp" ? auth.switchToSignIn : auth.switchToSignUp}
        </button>
        <p className="border-t border-stone-200 pt-4 type-caption text-stone-600">{auth.demoNote}</p>
      </form>
    </Dialog>
  );
}
