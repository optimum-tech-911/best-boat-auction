import type { Messages } from "@bba/i18n";

/** The strings of the bid panel, its review dialog and its history, picked on the server. */
export interface BidMessages {
  bid: Messages["bid"];
  errors: Messages["bidErrors"];
  notifications: Messages["notifications"];
  price: Messages["diagrams"]["price"];
  lot: Messages["lot"];
  close: string;
}

export function bidMessages(messages: Messages): BidMessages {
  return {
    bid: messages.bid,
    errors: messages.bidErrors,
    notifications: messages.notifications,
    price: messages.diagrams.price,
    lot: messages.lot,
    close: messages.common.close,
  };
}
