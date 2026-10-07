export interface LocalTime {
  hour: number;
  minute: number;
}

/**
 * One auction per month, closing on a Monday evening. Bidding runs for about 30 days before the
 * closing; boats are submitted a week before bidding opens, which leaves time to validate the
 * listing and photograph the boat. Each boat's viewing is fixed with its seller or broker during
 * the viewing period.
 */
export interface SaleCalendarRules {
  timeZone: string;
  /** 0 = Sunday … 6 = Saturday. */
  closingWeekday: number;
  /** 3 = the third such weekday of the month. */
  closingOccurrence: number;
  closingTime: LocalTime;
  submissionDaysBeforeClosing: number;
  submissionTime: LocalTime;
  biddingOpensDaysBeforeClosing: number;
  biddingOpensTime: LocalTime;
  /** Viewings take place from the opening of bidding until this many days before the closing. */
  lastViewingDaysBeforeClosing: number;
  lastViewingTime: LocalTime;
}

export const defaultSaleCalendarRules: SaleCalendarRules = {
  timeZone: "Europe/Paris",
  closingWeekday: 1,
  closingOccurrence: 3,
  closingTime: { hour: 20, minute: 0 },
  submissionDaysBeforeClosing: 35,
  submissionTime: { hour: 23, minute: 59 },
  biddingOpensDaysBeforeClosing: 28,
  biddingOpensTime: { hour: 20, minute: 0 },
  lastViewingDaysBeforeClosing: 2,
  lastViewingTime: { hour: 18, minute: 0 },
};

export interface SaleSchedule {
  /** Year and month, for example "2026-10". */
  id: string;
  year: number;
  /** 1 = January. */
  month: number;
  submissionDeadlineAt: number;
  opensAt: number;
  /** The period in which each boat's viewing is scheduled. */
  viewingsFrom: number;
  viewingsUntil: number;
  /** The first lot closes at this time; the following lots close one interval apart. */
  closingStartsAt: number;
}

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Milliseconds to add to a UTC instant to read the wall clock of a time zone. */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = wallClockFormatter(timeZone).formatToParts(new Date(instant));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const wallClock = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return wallClock - (instant - (((instant % 1000) + 1000) % 1000));
}

/** The instant at which a wall clock in the time zone shows the given date and time. */
export function zonedTimeToInstant(date: CalendarDate, time: LocalTime, timeZone: string): number {
  const wallClock = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
  const firstGuess = wallClock - zoneOffset(wallClock, timeZone);
  return wallClock - zoneOffset(firstGuess, timeZone);
}

function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function closingDate(year: number, month: number, rules: SaleCalendarRules): CalendarDate {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const firstOccurrence = 1 + ((rules.closingWeekday - firstWeekday + 7) % 7);
  return { year, month, day: firstOccurrence + (rules.closingOccurrence - 1) * 7 };
}

export function saleForMonth(year: number, month: number, rules: SaleCalendarRules = defaultSaleCalendarRules): SaleSchedule {
  const closing = closingDate(year, month, rules);
  const at = (date: CalendarDate, time: LocalTime) => zonedTimeToInstant(date, time, rules.timeZone);
  const opensAt = at(addDays(closing, -rules.biddingOpensDaysBeforeClosing), rules.biddingOpensTime);
  return {
    id: `${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
    submissionDeadlineAt: at(addDays(closing, -rules.submissionDaysBeforeClosing), rules.submissionTime),
    opensAt,
    viewingsFrom: opensAt,
    viewingsUntil: at(addDays(closing, -rules.lastViewingDaysBeforeClosing), rules.lastViewingTime),
    closingStartsAt: at(closing, rules.closingTime),
  };
}

function shiftMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + offset;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * Consecutive monthly sales starting with the first one that has not finished closing at `instant`.
 * `closingWindowMs` is how long the staggered closing of a sale lasts after its first lot.
 */
export function upcomingSales(instant: number, count: number, closingWindowMs: number, rules: SaleCalendarRules = defaultSaleCalendarRules): SaleSchedule[] {
  const wallClock = new Date(instant + zoneOffset(instant, rules.timeZone));
  let cursor = { year: wallClock.getUTCFullYear(), month: wallClock.getUTCMonth() + 1 };
  let sale = saleForMonth(cursor.year, cursor.month, rules);
  if (sale.closingStartsAt + closingWindowMs <= instant) {
    cursor = shiftMonth(cursor.year, cursor.month, 1);
    sale = saleForMonth(cursor.year, cursor.month, rules);
  }
  const sales = [sale];
  while (sales.length < count) {
    cursor = shiftMonth(cursor.year, cursor.month, 1);
    sales.push(saleForMonth(cursor.year, cursor.month, rules));
  }
  return sales;
}

/** The sale held the month before the given one. */
export function previousSale(sale: SaleSchedule, rules: SaleCalendarRules = defaultSaleCalendarRules): SaleSchedule {
  const { year, month } = shiftMonth(sale.year, sale.month, -1);
  return saleForMonth(year, month, rules);
}

/** Lots close one after another, one interval apart, in catalogue order. */
export function lotClosingTime(sale: SaleSchedule, position: number, closingIntervalMs: number): number {
  return sale.closingStartsAt + position * closingIntervalMs;
}
