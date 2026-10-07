"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { countryCodes, notificationTopics, type CountryCode, type ProfileResult, type ProfileUpdate, type Viewer } from "@bba/contracts";
import { defaultAuctionRules } from "@bba/domain";
import { formatMoney, href, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Button, Checkbox, EmptyState, Field, Select, SectionHeader, StatusLine, TextInput, useToast } from "@bba/ui";
import { useAuthDialog } from "@/features/account/auth-dialog";
import { useLiveAuction, useViewer } from "@/features/live/live-auction";

type SettingsCopy = Messages["account"]["settings"];
type ProfileError = Extract<ProfileResult, { ok: false }>["reason"];
type SectionId = keyof SettingsCopy["sections"];

/** Anchors of the settings sections, in order. */
const sectionAnchors: Readonly<Record<SectionId, string>> = { profile: "profil", security: "securite", identity: "identite", notifications: "notifications", company: "entreprise" };

export interface SettingsMessages {
  account: Messages["account"];
  auth: Pick<Messages["auth"], "verifyBody" | "verifyAction" | "verifyDemo" | "verified" | "notVerified" | "email">;
  countries: Messages["countries"];
  signOut: string;
  myBids: string;
}

/** ACC settings: a section list on the left from 1024 px and C-02 forms in a 640 px column. */
export function SettingsScreen({ locale, messages }: { locale: Locale; messages: SettingsMessages }) {
  const copy = messages.account.settings;
  const viewer = useViewer();
  const auth = useAuthDialog();

  if (!viewer) {
    return (
      <div className="page-container py-12 lg:py-20">
        <SectionHeader as="h1" title={copy.title} />
        <EmptyState icon={LogIn} title={messages.account.signedOut.title} action={<Button variant="primary" onClick={() => auth.open()}>{messages.account.signedOut.action}</Button>}>
          {messages.account.signedOut.text}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page-container py-12 lg:py-20">
      <Link href={href(locale, "account")} className="type-body-s text-teal-700 hover:underline underline-offset-3">{messages.myBids}</Link>
      <SectionHeader as="h1" title={copy.title} className="mt-2" />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <nav aria-label={copy.nav} className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-24 flex flex-col border-l border-stone-200">
            {(Object.keys(sectionAnchors) as SectionId[]).map((id) => (
              <li key={id}>
                <a href={`#${sectionAnchors[id]}`} className="-ml-hairline flex min-h-control-md items-center border-l-2 border-transparent pl-4 type-body-m text-stone-600 hover:border-navy-900 hover:text-navy-900">{copy.sections[id]}</a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Each form remounts with the saved viewer, so its fields start from what was stored. */}
        <div key={JSON.stringify(viewer)} className="flex max-w-form flex-col gap-12 lg:col-span-9">
          <ProfileForm viewer={viewer} messages={messages} />
          <SecuritySection messages={messages} />
          <IdentitySection viewer={viewer} locale={locale} messages={messages} />
          <NotificationsForm viewer={viewer} messages={messages} />
          <CompanyForm viewer={viewer} messages={messages} />
          <p className="type-caption text-stone-600">{copy.demo}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ id, title, children }: { id: SectionId; title: string; children: ReactNode }) {
  return (
    <section id={sectionAnchors[id]} aria-labelledby={`${sectionAnchors[id]}-title`} className="scroll-mt-24 border-t border-stone-200 pt-8">
      <h2 id={`${sectionAnchors[id]}-title`} className="type-title-l text-navy-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Saves a profile change and reports it: a toast on success, the field error otherwise. */
function useProfileSave(copy: SettingsCopy) {
  const live = useLiveAuction();
  const toast = useToast();
  const [error, setError] = useState<ProfileError | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (update: ProfileUpdate) => {
    setBusy(true);
    const result = await live.updateProfile(update);
    setBusy(false);
    if (result.ok) toast({ tone: "success", title: copy.saved });
    else setError(result.reason);
  };
  return { save, busy, error, errorText: (reason: ProfileError) => (error === reason ? copy.errors[reason] : undefined) };
}

function ProfileForm({ viewer, messages }: { viewer: Viewer; messages: SettingsMessages }) {
  const copy = messages.account.settings;
  const [name, setName] = useState(viewer.displayName);
  const [country, setCountry] = useState<CountryCode>(viewer.country);
  const { save, busy, errorText } = useProfileSave(copy);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save({ displayName: name, country });
  };
  return (
    <SettingsSection id="profile" title={copy.sections.profile}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label={copy.name} error={errorText("name_required")}>
          {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />}
        </Field>
        <Field label={messages.auth.email} hint={copy.emailHint} value={viewer.contactVerified ? <StatusLine tone="leading">{copy.emailVerified}</StatusLine> : undefined}>
          {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} type="email" value={viewer.email} readOnly className="bg-stone-100" />}
        </Field>
        <Field label={copy.country}>
          {({ id }) => (
            <Select id={id} value={country} onChange={(event) => setCountry(event.target.value as CountryCode)}>
              {countryCodes.map((code) => <option key={code} value={code}>{messages.countries[code]}</option>)}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="primary" loading={busy} className="self-start">{copy.save}</Button>
      </form>
    </SettingsSection>
  );
}

function SecuritySection({ messages }: { messages: SettingsMessages }) {
  const live = useLiveAuction();
  const copy = messages.account.settings;
  return (
    <SettingsSection id="security" title={copy.sections.security}>
      <p className="type-body-m text-stone-600">{copy.security}</p>
      <Button variant="secondary" className="mt-5" onClick={() => void live.signOut()}>{messages.signOut}</Button>
    </SettingsSection>
  );
}

function IdentitySection({ viewer, locale, messages }: { viewer: Viewer; locale: Locale; messages: SettingsMessages }) {
  const live = useLiveAuction();
  const [busy, setBusy] = useState(false);
  const verify = async () => {
    setBusy(true);
    await live.verifyIdentity();
    setBusy(false);
  };
  return (
    <SettingsSection id="identity" title={messages.account.settings.sections.identity}>
      <StatusLine tone={viewer.identityVerified ? "leading" : "waiting"}>{viewer.identityVerified ? messages.auth.verified : messages.auth.notVerified}</StatusLine>
      <p className="mt-3 type-body-m text-stone-600">{interpolate(messages.auth.verifyBody, { amount: formatMoney(defaultAuctionRules.idCheckFromCents, locale) })}</p>
      {!viewer.identityVerified && (
        <>
          <Button variant="primary" className="mt-5" loading={busy} onClick={() => void verify()}>{messages.auth.verifyAction}</Button>
          <p className="mt-3 type-caption text-stone-600">{messages.auth.verifyDemo}</p>
        </>
      )}
    </SettingsSection>
  );
}

function NotificationsForm({ viewer, messages }: { viewer: Viewer; messages: SettingsMessages }) {
  const copy = messages.account.settings;
  const [preferences, setPreferences] = useState(viewer.notifications);
  const { save, busy } = useProfileSave(copy);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save({ notifications: preferences });
  };
  return (
    <SettingsSection id="notifications" title={copy.sections.notifications}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 type-body-m text-stone-600">{copy.notificationsIntro}</legend>
          {notificationTopics.map((topic) => (
            <Checkbox key={topic} checked={preferences[topic]} onChange={(event) => setPreferences({ ...preferences, [topic]: event.target.checked })}>{copy.topics[topic]}</Checkbox>
          ))}
        </fieldset>
        <Button type="submit" variant="primary" loading={busy} className="mt-2 self-start">{copy.save}</Button>
      </form>
    </SettingsSection>
  );
}

function CompanyForm({ viewer, messages }: { viewer: Viewer; messages: SettingsMessages }) {
  const copy = messages.account.settings;
  const [enabled, setEnabled] = useState(viewer.company !== null);
  const [company, setCompany] = useState(viewer.company ?? { name: "", vatNumber: "" });
  const { save, busy, errorText } = useProfileSave(copy);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save({ company: enabled ? company : null });
  };
  return (
    <SettingsSection id="company" title={copy.sections.company}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)}>{copy.companyToggle}</Checkbox>
        {enabled && (
          <>
            <Field label={copy.companyName} error={errorText("company_name_required")}>
              {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="organization" value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} />}
            </Field>
            <Field label={copy.vatNumber} hint={copy.vatHint} error={errorText("invalid_vat_number")}>
              {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} autoCapitalize="characters" value={company.vatNumber} onChange={(event) => setCompany({ ...company, vatNumber: event.target.value })} />}
            </Field>
          </>
        )}
        <Button type="submit" variant="primary" loading={busy} className="self-start">{copy.save}</Button>
      </form>
    </SettingsSection>
  );
}
