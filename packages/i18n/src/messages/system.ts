import type { Locale } from "../locales";

/**
 * The copy of the not-found and error pages. Kept apart from the main dictionaries so that client
 * error boundaries can import it without shipping every message to the browser.
 */
export interface SystemMessages {
  notFound: { eyebrow: string; title: string; text: string; home: string; auctions: string };
  error: { eyebrow: string; title: string; text: string; retry: string; home: string };
}

export const systemMessages: Readonly<Record<Locale, SystemMessages>> = {
  fr: {
    notFound: {
      eyebrow: "Erreur 404",
      title: "Cette page n’existe pas ou plus.",
      text: "Le lot a peut-être été retiré de la vente, ou l’adresse contient une erreur.",
      home: "Retour à l’accueil",
      auctions: "Voir les ventes en cours",
    },
    error: {
      eyebrow: "Erreur",
      title: "Un problème est survenu.",
      text: "La page n’a pas pu s’afficher. Réessayez dans un instant ; vos enchères ne sont pas affectées.",
      retry: "Réessayer",
      home: "Retour à l’accueil",
    },
  },
  en: {
    notFound: {
      eyebrow: "Error 404",
      title: "This page does not exist, or no longer does.",
      text: "The lot may have been withdrawn from the auction, or the address contains a mistake.",
      home: "Back to the homepage",
      auctions: "See current auctions",
    },
    error: {
      eyebrow: "Error",
      title: "Something went wrong.",
      text: "The page could not be displayed. Try again in a moment; your bids are not affected.",
      retry: "Try again",
      home: "Back to the homepage",
    },
  },
};
