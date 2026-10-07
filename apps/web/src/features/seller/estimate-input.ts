import { boatTypes, type BoatType } from "@bba/contracts";
import type { HoldingCostInput } from "@bba/domain";

/**
 * The defaults behind the three-question estimate: the specification's worked example, so a 10 m
 * motorboat worth 60 000 € gives about 1 108 € a month.
 */
export const defaultEstimateInput: Omit<HoldingCostInput, "currentYear"> = {
  lengthMetres: 10,
  yearBuilt: 2008,
  valueCents: 6_000_000,
  condition: "good",
  coast: "mediterranean",
  storage: "marina",
  wintersAshore: false,
  winterMonths: 5,
  taxCents: 50_000,
  daysUsedPerYear: 15,
};

export interface SellPrefill {
  type: BoatType;
  lengthMetres: number;
  valueCents: number;
}

/** The homepage's answers, carried to the sell page in its address so a reload or a language change keeps them. */
export function sellPrefillQuery({ type, lengthMetres, valueCents }: SellPrefill): Record<string, string> {
  return { type, length: String(lengthMetres), value: String(Math.round(valueCents / 100)) };
}

export function readSellPrefill(query: Readonly<Record<string, string | string[] | undefined>>): Partial<SellPrefill> {
  const first = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const type = first("type");
  const length = Number.parseFloat(first("length") ?? "");
  const value = Number.parseInt(first("value") ?? "", 10);
  return {
    ...(type && (boatTypes as readonly string[]).includes(type) ? { type: type as BoatType } : {}),
    ...(Number.isFinite(length) && length >= 3 && length <= 40 ? { lengthMetres: length } : {}),
    ...(Number.isFinite(value) && value >= 0 && value <= 50_000_000 ? { valueCents: value * 100 } : {}),
  };
}
