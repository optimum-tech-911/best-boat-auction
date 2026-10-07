import type { CountryCode } from "@bba/contracts";

export interface DemoBidder {
  id: string;
  /** The public pseudonym code, shown as "Enchérisseur 4821". */
  alias: string;
  country: CountryCode;
}

/** Simulated bidders. Their bids follow a fixed schedule per lot; none of them is a real person. */
export const demoBidders: readonly DemoBidder[] = [
  ["1043", "NL"], ["1187", "FR"], ["2290", "BE"], ["2384", "DE"], ["3121", "FR"], ["3355", "NL"],
  ["4078", "FR"], ["4410", "AT"], ["4821", "NL"], ["5096", "DE"], ["5530", "FR"], ["5874", "BE"],
  ["6012", "IT"], ["6449", "NL"], ["6903", "FR"], ["7215", "HR"], ["7562", "ES"], ["8034", "FR"],
  ["8361", "DE"], ["8790", "NL"],
].map(([alias, country]) => ({ id: `bidder-${alias}`, alias: alias as string, country: country as CountryCode }));

export const VIEWER_ID = "viewer";
export const VIEWER_ALIAS = "7350";

const byId = new Map(demoBidders.map((bidder) => [bidder.id, bidder]));

export function bidderIdentity(id: string, viewerCountry: CountryCode): { alias: string; country: CountryCode } {
  if (id === VIEWER_ID) return { alias: VIEWER_ALIAS, country: viewerCountry };
  return byId.get(id) ?? { alias: id.replace(/\D/g, "") || "0000", country: "FR" };
}
