import type { BasisPoints, Cents } from "./money";

export const coastAreas = ["mediterranean", "corsica", "atlantic", "channel", "inland", "benelux_germany"] as const;
export type CoastArea = (typeof coastAreas)[number];

export const storageModes = ["marina", "dry_stack", "mooring", "hard", "trailer"] as const;
export type StorageMode = (typeof storageModes)[number];

export const boatConditions = ["excellent", "good", "fair", "needs_work"] as const;
export type BoatCondition = (typeof boatConditions)[number];

/**
 * Parameters of the cost-of-waiting algorithm. Each change creates a new version in
 * the admin panel, and each saved estimate stores the version it used.
 */
export interface HoldingCostParameters {
  version: string;
  /** Berth: berthFactor × L^berthExponent euros a year, L in metres. */
  berthFactor: number;
  berthExponent: number;
  coastFactors: Readonly<Record<CoastArea, number>>;
  storageFactors: Readonly<Record<Exclude<StorageMode, "trailer">, number>>;
  trailerYearlyEuros: number;
  insuranceRate: BasisPoints;
  insuranceMinimumEuros: number;
  maintenanceRate: BasisPoints;
  maintenancePerMetreEuros: number;
  winterPerMetrePerMonthEuros: number;
  /** [from age in years, yearly loss of value]. */
  depreciationBands: readonly (readonly [number, BasisPoints])[];
  conditionFactors: Readonly<Record<BoatCondition, number>>;
  savingsRate: BasisPoints;
  brokerCommission: BasisPoints;
}

export const defaultHoldingCostParameters: HoldingCostParameters = {
  version: "2026-10-06",
  // France: 25 × L^2.25 € a year, through the 2026 national marina observatory averages.
  berthFactor: 25,
  berthExponent: 2.25,
  coastFactors: { mediterranean: 1.3, corsica: 1, atlantic: 0.85, channel: 0.75, inland: 0.55, benelux_germany: 0.8 },
  storageFactors: { marina: 1, dry_stack: 0.8, mooring: 0.35, hard: 0.5 },
  trailerYearlyEuros: 150,
  insuranceRate: 100,
  insuranceMinimumEuros: 200,
  maintenanceRate: 500,
  maintenancePerMetreEuros: 75,
  winterPerMetrePerMonthEuros: 15,
  depreciationBands: [[0, 1_500], [1, 700], [6, 500], [11, 400], [21, 300]],
  conditionFactors: { excellent: 0.85, good: 1, fair: 1.25, needs_work: 1.5 },
  // Livret A since 1 August 2026.
  savingsRate: 170,
  brokerCommission: 800,
};

export interface HoldingCostInput {
  lengthMetres: number;
  yearBuilt: number;
  valueCents: Cents;
  condition: BoatCondition;
  coast: CoastArea;
  storage: StorageMode;
  wintersAshore: boolean;
  winterMonths: number;
  /** The owner's yearly boat tax, from their own notice. */
  taxCents: Cents;
  daysUsedPerYear: number | null;
  /** The owner's own yearly figures replace the model when given. */
  ownerBerthCents?: Cents | null;
  ownerInsuranceCents?: Cents | null;
  /** The year the estimate is made, for the boat's age. */
  currentYear: number;
}

export const holdingCostLines = ["berth", "insurance", "maintenance", "winter", "tax", "depreciation", "opportunity"] as const;
export type HoldingCostLineKey = (typeof holdingCostLines)[number];

export interface HoldingCostLine {
  key: HoldingCostLineKey;
  yearlyCents: Cents;
  source: "owner" | "model";
}

export interface HoldingCostEstimate {
  parametersVersion: string;
  /** Lines with a cost, largest first. */
  lines: HoldingCostLine[];
  yearlyCents: Cents;
  monthlyCents: Cents;
  perDayUsedCents: Cents | null;
  ageYears: number;
  depreciationRate: BasisPoints;
  valueIn12MonthsCents: Cents;
  brokerCommissionCents: Cents;
}

const toCents = (euros: number): Cents => Math.round(euros * 100);
const rate = (value: BasisPoints) => value / 10_000;

/** The cost-of-waiting algorithm: C_year = B + I + M + W + T + D + O. */
export function estimateHoldingCost(input: HoldingCostInput, parameters: HoldingCostParameters = defaultHoldingCostParameters): HoldingCostEstimate {
  const length = Math.max(0, input.lengthMetres);
  const value = Math.max(0, input.valueCents) / 100;
  const ageYears = Math.max(0, input.currentYear - input.yearBuilt);

  const modelBerth = input.storage === "trailer"
    ? parameters.trailerYearlyEuros
    : parameters.berthFactor * length ** parameters.berthExponent * parameters.coastFactors[input.coast] * parameters.storageFactors[input.storage];
  const ownerBerth = input.ownerBerthCents ?? null;
  const ownerInsurance = input.ownerInsuranceCents ?? null;

  let depreciationRate = parameters.depreciationBands[0]?.[1] ?? 0;
  for (const [fromAge, bandRate] of parameters.depreciationBands) {
    if (ageYears >= fromAge) depreciationRate = bandRate;
  }
  const depreciation = value * rate(depreciationRate) * parameters.conditionFactors[input.condition];

  const allLines: HoldingCostLine[] = [
    { key: "berth", yearlyCents: ownerBerth ?? toCents(modelBerth), source: ownerBerth === null ? "model" : "owner" },
    { key: "insurance", yearlyCents: ownerInsurance ?? toCents(Math.max(parameters.insuranceMinimumEuros, value * rate(parameters.insuranceRate))), source: ownerInsurance === null ? "model" : "owner" },
    { key: "maintenance", yearlyCents: toCents(Math.max(value * rate(parameters.maintenanceRate), parameters.maintenancePerMetreEuros * length)), source: "model" },
    { key: "winter", yearlyCents: input.wintersAshore && input.storage !== "trailer" ? toCents(parameters.winterPerMetrePerMonthEuros * length * Math.max(0, input.winterMonths)) : 0, source: "model" },
    { key: "tax", yearlyCents: Math.max(0, input.taxCents), source: "owner" },
    { key: "depreciation", yearlyCents: toCents(depreciation), source: "model" },
    { key: "opportunity", yearlyCents: toCents(value * rate(parameters.savingsRate)), source: "model" },
  ];
  const lines = allLines.filter((line) => line.yearlyCents > 0).sort((a, b) => b.yearlyCents - a.yearlyCents);
  const yearlyCents = lines.reduce((total, line) => total + line.yearlyCents, 0);

  return {
    parametersVersion: parameters.version,
    lines,
    yearlyCents,
    monthlyCents: Math.round(yearlyCents / 12),
    perDayUsedCents: input.daysUsedPerYear && input.daysUsedPerYear > 0 ? Math.round(yearlyCents / input.daysUsedPerYear) : null,
    ageYears,
    depreciationRate,
    valueIn12MonthsCents: Math.max(0, input.valueCents - toCents(depreciation)),
    brokerCommissionCents: toCents(value * rate(parameters.brokerCommission)),
  };
}

/** The cumulative cost of keeping the boat for a number of months. */
export function waitingCost(estimate: Pick<HoldingCostEstimate, "yearlyCents">, months: number): Cents {
  return Math.round((estimate.yearlyCents * months) / 12);
}
