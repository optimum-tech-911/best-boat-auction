import type { LocalizedText } from "@bba/contracts";
import { text } from "./types";

/** Questions buyers commonly ask, with the seller's answer. Each lot shows two or three of them. */
export const demoQuestions: readonly { question: LocalizedText; answer: LocalizedText }[] = [
  {
    question: text("Des factures d’entretien sont-elles disponibles ?", "Are service invoices available?"),
    answer: text("Oui, les factures des cinq dernières années sont dans les documents réservés aux enchérisseurs inscrits.", "Yes, the last five years of invoices are in the documents for registered bidders."),
  },
  {
    question: text("Le bateau peut-il rester au port après la vente ?", "Can the boat stay in the marina after the sale?"),
    answer: text("La place est réglée jusqu’au 31 décembre ; la remise peut se faire sur place, sans frais de port pour l’acheteur.", "The berth is paid until 31 December; handover can take place there, with no berth fee for the buyer."),
  },
  {
    question: text("Un essai est-il possible pendant la visite ?", "Is a trial possible during the viewing?"),
    answer: text("Le moteur est démarré au ponton pendant la visite. Un essai en mer peut être organisé avec votre expert, sur rendez-vous.", "The engine is started at the pontoon during the viewing. A sea trial can be arranged with your surveyor, by appointment."),
  },
  {
    question: text("Le prix de réserve est-il proche du prix de départ ?", "Is the reserve close to the starting price?"),
    answer: text("Le montant reste confidentiel. L’indication « Prix de réserve atteint » s’affiche sur la page dès qu’il l’est.", "The amount stays confidential. “Reserve met” appears on the page as soon as it is."),
  },
  {
    question: text("Le transport jusqu’en Bretagne peut-il être organisé ?", "Can transport to Brittany be arranged?"),
    answer: text("Oui, notre service transport vous envoie un devis ; le bateau est livrable sur remorque routière.", "Yes, our transport service sends you a quote; the boat can travel on a road trailer."),
  },
  {
    question: text("Une expertise récente existe-t-elle ?", "Is there a recent survey?"),
    answer: text("Pas d’expertise récente ; vous pouvez en commander une avant d’enchérir, le vendeur donnera accès au bateau.", "No recent survey; you can order one before bidding and the seller will give access to the boat."),
  },
];
