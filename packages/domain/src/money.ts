/** Every amount is an integer number of euro cents. Version 1 trades in EUR only. */
export type Cents = number;

/** Rates are basis points: 1800 = 18.00 %. */
export type BasisPoints = number;

export const BASIS_POINTS_PER_UNIT = 10_000;

export function euros(amount: number): Cents {
  return Math.round(amount * 100);
}

/** Bids are placed in whole euros: a positive multiple of 100 cents. */
export function isWholeEuros(amount: Cents): boolean {
  return Number.isSafeInteger(amount) && amount > 0 && amount % 100 === 0;
}

/** Applies a rate to an amount, rounding half-up to the cent as every invoice line does. */
export function applyRate(amount: Cents, rate: BasisPoints): Cents {
  const product = amount * rate;
  const quotient = Math.floor(product / BASIS_POINTS_PER_UNIT);
  const remainder = product - quotient * BASIS_POINTS_PER_UNIT;
  return remainder * 2 >= BASIS_POINTS_PER_UNIT ? quotient + 1 : quotient;
}
