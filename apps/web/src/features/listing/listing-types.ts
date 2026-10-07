import type { BoatType } from "@bba/contracts";
import type { Locale, Messages } from "@bba/i18n";
import type { ListingDraft } from "./listing-draft";

/** The message slices the listing form needs. */
export interface ListingClientMessages {
  listing: Messages["listing"];
  map: Messages["map"];
  types: Readonly<Record<BoatType, string>>;
  fuels: Messages["catalogue"]["fuels"];
  storages: Messages["lotPage"]["storages"];
  conditions: Messages["sell"]["conditions"];
  packs: Messages["sell"]["packs"];
  countries: Messages["countries"];
  common: Pick<Messages["common"], "optional">;
}

/** The sale a listing sent today joins, formatted on the server. */
export interface ListingSale {
  /** "vente de novembre", as it reads inside a sentence. */
  name: string;
  /** "16 novembre". */
  closing: string;
  /** "12 octobre". */
  deadline: string;
}

/** What every step receives. */
export interface StepProps {
  locale: Locale;
  messages: ListingClientMessages;
  draft: ListingDraft;
  update: (patch: Partial<ListingDraft>) => void;
  /** The message for a field once the step has been checked, otherwise undefined. */
  errorFor: (field: string) => string | undefined;
}
