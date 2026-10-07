import { defaultAuctionRules, defaultSaleCalendarRules, premiumRate } from "@bba/domain";
import { formatMoney, formatPercent, type Locale, type TextParams } from "@bba/i18n";

const MINUTE = 60_000;

/** The worked example quoted by the explanations: a boat sold for 100 000 €. */
export const EXAMPLE_HAMMER_CENTS = 10_000_000;

/**
 * Every figure the copy quotes from the house rules, formatted for the language. Messages use
 * these placeholders instead of writing the numbers, so a rule change can never leave a page
 * saying something false.
 */
export function ruleParams(locale: Locale): TextParams {
  const rules = defaultAuctionRules;
  const calendar = defaultSaleCalendarRules;
  return {
    window: rules.softCloseWindowMs / MINUTE,
    extension: rules.extensionMs / MINUTE,
    hours: rules.sellerDecisionHours,
    paymentDays: rules.paymentDays,
    collectionDays: rules.collectionDays,
    biddingDays: calendar.biddingOpensDaysBeforeClosing,
    submissionDays: calendar.submissionDaysBeforeClosing,
    rate: formatPercent(premiumRate(0, rules), locale),
    vat: formatPercent(rules.vatOnPremium, locale),
    idCheck: formatMoney(rules.idCheckFromCents, locale),
    brokerShare: formatPercent(rules.brokerTerms.buyerIntroductionShare, locale),
  };
}
