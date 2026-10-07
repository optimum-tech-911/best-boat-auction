"use client";

import { useState, type ReactNode } from "react";
import { Gavel, Heart, Search, Share2 } from "lucide-react";
import type { Locale } from "@bba/i18n";
import {
  Accordion,
  Badge,
  Button,
  Checkbox,
  Countdown,
  Dialog,
  Divider,
  EmptyState,
  Field,
  FilterChip,
  Flag,
  LiveDot,
  MoneyInput,
  PriceBlock,
  Radio,
  SectionHeader,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  StatusLine,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TextInput,
  useNow,
  useToast,
  type ButtonVariant,
} from "@bba/ui";

const HOUR = 3_600_000;

function Specimen({ id, title, children, dark = false }: { id: string; title: string; children: ReactNode; dark?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-stone-300 py-12">
      <h2 id={`${id}-title`} className="type-eyebrow text-stone-600">{title}</h2>
      <div className={dark ? "on-dark mt-6 rounded-md bg-navy-900 p-8 text-ivory-100" : "mt-6"}>{children}</div>
    </section>
  );
}

/** Every component of DESIGN_SYSTEM.md section 10 in its variants and states (task D0). */
export function ComponentGallery({ locale }: { locale: Locale }) {
  const now = useNow();
  const toast = useToast();
  const [money, setMoney] = useState<number | null>(6_000_000);
  const [bid, setBid] = useState<number | null>(1_450_000);
  const [length, setLength] = useState(10);
  const [mode, setMode] = useState<"single" | "max">("single");
  const [tab, setTab] = useState("presentation");
  const [chips, setChips] = useState<string[]>(["sailboat"]);
  const [dialog, setDialog] = useState<"md" | "lg" | null>(null);
  const [price, setPrice] = useState(1_450_000);
  const variants: ButtonVariant[] = ["primary", "bid", "secondary", "link", "destructive"];

  return (
    <div className="page-container pb-24 pt-12">
      <SectionHeader as="h1" eyebrow="Design system · D0" title="Composants" intro="Chaque composant de DESIGN_SYSTEM.md, dans ses variantes et ses états." />

      <Specimen id="c01" title="C-01 Button">
        <div className="flex flex-col gap-6">
          {(["lg", "md", "sm"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-4">
              {variants.map((variant) => <Button key={variant} variant={variant} size={size} arrow={variant === "link"}>{variant === "bid" ? "Enchérir 14 500 €" : variant === "link" ? "Voir les lots" : "Vendre mon bateau"}</Button>)}
              <Button size={size} icon={Gavel}>Avec icône</Button>
              <Button size={size} loading>Chargement</Button>
              <Button size={size} disabled>Désactivé</Button>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen id="c01-dark" title="C-01 Button on dark surfaces" dark>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary-inverse" arrow>Voir les lots</Button>
          <Button variant="secondary-inverse">Vendre mon bateau</Button>
          <Button variant="primary-inverse" size="sm">Calculer</Button>
        </div>
      </Specimen>

      <Specimen id="c02" title="C-02 Text input and money input">
        <div className="grid gap-8 md:grid-cols-2">
          <Field label="Nom complet" hint="Tel qu’il figure sur votre pièce d’identité.">
            {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} placeholder="Camille Martin" />}
          </Field>
          <Field label="Adresse e-mail" error="Indiquez une adresse e-mail valide.">
            {({ id, describedBy, invalid }) => <TextInput id={id} aria-describedby={describedBy} invalid={invalid} defaultValue="camille@" />}
          </Field>
          <Field label="Valeur estimée" hint="Pas sûr ? Notre estimation est gratuite.">
            {({ id, describedBy }) => <MoneyInput id={id} aria-describedby={describedBy} locale={locale} value={money} onValueChange={setMoney} />}
          </Field>
          <Field label="Votre enchère" hint="Minimum 14 500 € · palier 500 €">
            {({ id, describedBy }) => <MoneyInput id={id} aria-describedby={describedBy} locale={locale} size="bid" value={bid} onValueChange={setBid} />}
          </Field>
          <Field label="Type de bateau">
            {({ id }) => <Select id={id} defaultValue="motorboat"><option value="motorboat">Bateau à moteur</option><option value="sailboat">Voilier</option></Select>}
          </Field>
          <Field label="Longueur" value={`${length} m`}>
            {({ id }) => <Slider id={id} min={4} max={25} step={0.5} value={length} onValueChange={setLength} />}
          </Field>
        </div>
      </Specimen>

      <Specimen id="c03" title="C-03 Tabs and segmented control">
        <SegmentedControl label="Type d’enchère" value={mode} onChange={setMode} options={[{ value: "single", label: "Enchère simple" }, { value: "max", label: "Enchère maximale" }]} />
        <Tabs className="mt-10" label="Sections du lot" value={tab} onChange={setTab} tabs={[
          { id: "presentation", label: "Présentation", content: <p className="max-w-measure type-body-m text-stone-600">Un croiseur de 11,40 m à trois cabines.</p> },
          { id: "specs", label: "Caractéristiques", content: <p className="type-body-m text-stone-600">Volvo Penta 29 ch.</p> },
          { id: "viewing", label: "Visite", content: <p className="type-body-m text-stone-600">Samedi 17 octobre, 10 h – 12 h.</p> },
        ]} />
      </Specimen>

      <Specimen id="c04" title="C-04 Checkbox and radio">
        <div className="flex flex-col gap-4">
          <Checkbox defaultChecked>Sans prix de réserve</Checkbox>
          <Checkbox>Clôture sous 24 h</Checkbox>
          <Radio name="specimen" defaultChecked>Enchère simple</Radio>
          <Radio name="specimen">Enchère maximale</Radio>
        </div>
      </Specimen>

      <Specimen id="c05" title="C-05 Filter chip">
        <div className="flex flex-wrap gap-3">
          {[["sailboat", "Voiliers", 3], ["motorboat", "Bateaux à moteur", 3], ["rib", "Semi-rigides", 2]].map(([value, label, count]) => (
            <FilterChip key={value} selected={chips.includes(value as string)} count={count as number} onClick={() => setChips((current) => current.includes(value as string) ? current.filter((item) => item !== value) : [...current, value as string])}>{label}</FilterChip>
          ))}
          <FilterChip removable removeLabel="Retirer le filtre Voiliers">Voiliers</FilterChip>
        </div>
      </Specimen>

      <Specimen id="c06-c07" title="C-06 Badge · C-07 Status line · live dot · flags">
        <div className="flex flex-wrap items-center gap-6">
          <Badge>Sans prix de réserve</Badge>
          <Badge>Nouveau</Badge>
          <StatusLine tone="leading">En tête</StatusLine>
          <StatusLine tone="outbid">Surenchéri</StatusLine>
          <StatusLine tone="urgent">Clôture imminente</StatusLine>
          <StatusLine tone="urgent">Prolongé +5 min</StatusLine>
          <StatusLine tone="waiting">En attente du vendeur</StatusLine>
          <StatusLine tone="sold">Vendu</StatusLine>
          <StatusLine tone="waiting">Non attribué</StatusLine>
          <StatusLine tone="live">En direct</StatusLine>
          <span className="flex items-center gap-2 type-eyebrow"><LiveDot />En direct</span>
          <span className="flex items-center gap-2 type-body-s"><Flag country="NL" />NL</span>
          <span className="flex items-center gap-2 type-body-s"><Flag country="FR" />FR</span>
          <span className="flex items-center gap-2 type-body-s"><Flag country="HR" />HR</span>
        </div>
      </Specimen>

      <Specimen id="c08" title="C-08 Countdown">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {([["12 jours", 12 * 24 * HOUR + 4 * HOUR], ["4 heures", 4 * HOUR + 12 * 60_000], ["Moins d’une heure", 4 * 60_000 + 28_000], ["Clôturé", -1]] as const).map(([label, remaining]) => (
            <div key={label}>
              <p className="type-eyebrow text-stone-600">{label}</p>
              <div className="mt-2 flex flex-col gap-1">
                {(["xl", "l", "m", "s"] as const).map((size) => <Countdown key={size} endsAt={now + remaining} locale={locale} size={size} />)}
              </div>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen id="c09" title="C-09 Price block">
        <div className="flex flex-wrap items-end gap-12">
          <PriceBlock label="Enchère actuelle" valueCents={price} locale={locale} size="xl" note="12 enchères · hors frais acheteur 18 %" />
          <PriceBlock label="Prix de départ" valueCents={6_200_000} locale={locale} size="m" />
          <PriceBlock label="Enchère finale" valueCents={1_925_000} locale={locale} size="s" />
          <Button variant="secondary" size="sm" onClick={() => setPrice((value) => value + 50_000)}>Simuler une nouvelle enchère</Button>
        </div>
      </Specimen>

      <Specimen id="c13-c14" title="C-13 Dialog · C-14 Toast">
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => setDialog("md")}>Dialogue md</Button>
          <Button variant="secondary" onClick={() => setDialog("lg")}>Dialogue lg</Button>
          <Button variant="secondary" onClick={() => toast({ tone: "danger", title: "Vous avez été surenchéri", body: "Solenne 38 est maintenant à 70 000 €." })}>Toast danger</Button>
          <Button variant="secondary" onClick={() => toast({ tone: "success", title: "Enchère placée · 14 500 €", body: "Vous êtes en tête sur Kerlys 31." })}>Toast succès</Button>
        </div>
        <Dialog open={dialog !== null} size={dialog ?? "md"} onClose={() => setDialog(null)} title="Vérifiez votre enchère" closeLabel="Fermer"
          actions={<><Button variant="secondary" onClick={() => setDialog(null)}>Modifier</Button><Button variant="bid" onClick={() => setDialog(null)}>Confirmer l’enchère de 14 500 €</Button></>}>
          <p className="type-body-m text-stone-600">Sous 768 px, ce dialogue devient une feuille en bas de l’écran.</p>
        </Dialog>
      </Specimen>

      <Specimen id="c15" title="C-15 Section header">
        <SectionHeader eyebrow="Vente d’octobre · clôture lundi 19 oct. dès 20 h" title="Les prochains lots à clôturer" intro="Les lots se clôturent l’un après l’autre." action={<Button variant="link" arrow>Tous les lots (12)</Button>} />
      </Specimen>

      <Specimen id="c17" title="C-17 Table">
        <Table>
          <TableHead><tr><TableHeader>Tranche</TableHeader><TableHeader numeric>Frais acheteur</TableHeader></tr></TableHead>
          <TableBody>
            <TableRow><TableCell>Prix de départ jusqu’à 25 000 €</TableCell><TableCell numeric>18 %</TableCell></TableRow>
            <TableRow><TableCell>De 25 000 € à 100 000 €</TableCell><TableCell numeric>12 %</TableCell></TableRow>
            <TableRow><TableCell>À partir de 100 000 €</TableCell><TableCell numeric>8 %</TableCell></TableRow>
          </TableBody>
        </Table>
      </Specimen>

      <Specimen id="c18-c19" title="C-18 Empty state · C-19 Skeleton">
        <div className="grid gap-12 md:grid-cols-2">
          <EmptyState icon={Search} title="Aucun lot ne correspond" action={<Button variant="secondary">Effacer les filtres</Button>}>Modifiez ou effacez les filtres pour voir plus de bateaux.</EmptyState>
          <div className="flex flex-col gap-4">
            <Skeleton className="aspect-4/3 w-full rounded-md" />
            <Skeleton className="h-icon-l w-1/2" />
            <Skeleton className="h-icon-m w-1/3" />
          </div>
        </div>
      </Specimen>

      <Specimen id="faq" title="Accordion · divider · icons">
        <Accordion items={[
          { id: "a", title: "Puis-je retirer une enchère ?", content: "Non : les enchères sont fermes et définitives." },
          { id: "b", title: "Pourquoi un lot reste-t-il ouvert après l’heure de clôture ?", content: "Une offre dans les 5 dernières minutes prolonge le lot de 5 minutes." },
        ]} />
        <Divider className="my-8" />
        <div className="flex gap-4 text-navy-900"><Heart size={16} strokeWidth={1.5} /><Share2 size={20} strokeWidth={1.5} /><Search size={24} strokeWidth={1.5} /></div>
      </Specimen>
    </div>
  );
}
