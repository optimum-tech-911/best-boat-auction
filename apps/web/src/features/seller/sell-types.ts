import type { BoatType } from "@bba/contracts";
import type { Messages } from "@bba/i18n";
import type { JourneyStep } from "@bba/ui";

/** The message slices the sell page's client components need. */
export interface SellClientMessages {
  sell: Messages["sell"];
  types: Readonly<Record<BoatType, string>>;
  cost: Messages["diagrams"]["cost"];
  waiting: Messages["diagrams"]["waiting"];
  journeyTitle: string;
  common: Pick<Messages["common"], "close" | "optional">;
}

/** The next sale still open for submissions, formatted on the server. */
export interface NextSubmissionSale {
  /** "16 novembre". */
  date: string;
  /** The submission deadline, "26 octobre". */
  deadline: string;
  steps: readonly JourneyStep[];
}

/** The estimator's inputs and results panels, by id: shared by the server layout and the mobile bar. */
export const estimatorIds = { inputs: "estimation-saisie", results: "estimation-resultat" } as const;
