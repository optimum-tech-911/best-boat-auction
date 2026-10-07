import type { BoatType, MediaImage } from "@bba/contracts";
import { lotPhotos } from "./lot-photos.generated";
import { text } from "./types";

/*
 * Temporary photography supplied by the user (docs/design/IMAGE_USAGE.md). Lot photographs come
 * first from scripts/import-lot-photos.mjs, then from the earlier illustrative example pairs.
 * They are not photographs of the named demonstration lots. A lot without any image shows the
 * design system's "Photo à venir" placeholder until its photos arrive.
 */

const example = (name: string, view: 1 | 2, alt: MediaImage["alt"]): MediaImage => ({
  src: `/images/boats/examples/${name}-${view}.webp`, width: 1448, height: 1086, focalPoint: "50% 50%", alt,
});

const pair = (name: string, alt: MediaImage["alt"]): MediaImage[] => [example(name, 1, alt), example(name, 2, alt)];

const editorial = (file: string, focalPoint: string, alt: MediaImage["alt"], portrait = true): MediaImage => ({
  src: `/images/editorial/${file}.webp`, width: portrait ? 1024 : 1536, height: portrait ? 1536 : 1024, focalPoint, alt,
});

/** DESIGN_SYSTEM.md 14.2: category tiles, story and seller images, with their focal points. */
export const editorialImages = {
  motorboat: editorial("motor-yacht", "50% 55%", text("Un yacht à moteur avec flybridge en navigation sur une mer calme", "A flybridge motor yacht cruising on a calm sea")),
  sailboat: editorial("sailing-yacht", "50% 40%", text("Un voilier de croisière sous voiles, légèrement gîté", "A cruising sailboat under full sail, heeling slightly")),
  speedboat: editorial("sports-motorboat", "50% 60%", text("Un runabout glissant sur un lac alpin", "A runabout gliding on an alpine lake")),
  rib: editorial("rib-underway", "50% 60%", text("Un semi-rigide longeant une côte rocheuse", "A rigid inflatable boat running along a rocky coast")),
  catamaran: editorial("catamaran-at-anchor", "50% 55%", text("Un catamaran au mouillage dans une baie turquoise", "A sailing catamaran at anchor in a turquoise bay")),
  sloep: { ...example("open-launch", 1, text("Une sloep à coque bleu nuit amarrée au ponton", "A navy-hulled sloep moored at a pontoon")), focalPoint: "45% 60%" },
  seller: editorial("owner-mooring", "50% 50%", text("Les mains d’un propriétaire lovant une amarre sur un pont en teck", "An owner’s hands coiling a mooring line on a teak deck")),
  viewing: editorial("boat-viewing", "50% 50%", text("Des visiteurs, de dos, inspectent un voilier au ponton", "Visitors, seen from behind, inspecting a sailboat at the pontoon"), false),
  handover: editorial("boat-handover", "50% 50%", text("Un jeu de clés de bateau remis au-dessus d’un ponton", "A set of boat keys handed over above a pontoon"), false),
  marina: editorial("marina-at-sunset", "50% 50%", text("Une marina européenne au coucher du soleil, vue du ciel", "An aerial view of a European marina at golden hour"), false),
} as const;

export type EditorialImageName = keyof typeof editorialImages;

export const categoryImages: Readonly<Record<BoatType, MediaImage>> = {
  sailboat: editorialImages.sailboat,
  motorboat: editorialImages.motorboat,
  speedboat: editorialImages.speedboat,
  rib: editorialImages.rib,
  sloep: editorialImages.sloep,
  catamaran: editorialImages.catamaran,
};

/** Illustrative example pairs for lots that have no imported photographs yet. */
const examplePairs: Readonly<Record<number, MediaImage[]>> = {
  7703: pair("daysailer", text("Daysailer aux lignes basses au ponton", "Low-profile daysailer at the pontoon")),
  7704: pair("cabin-motorboat", text("Croiseur à moteur à coque bleu nuit avec timonerie", "Navy-hulled motor cruiser with a wheelhouse")),
  7705: [editorialImages.motorboat],
  7708: [editorialImages.speedboat],
  7707: pair("open-motorboat", text("Open blanc à console centrale amarré au ponton", "White centre-console open boat moored at the pontoon")),
  7709: pair("rib-grey-console", text("Semi-rigide à flotteurs gris et console blanche", "RIB with grey tubes and a white console")),
  7711: pair("open-launch", text("Sloep à coque bleu nuit et coussins crème", "Navy-hulled sloep with cream cushions")),
  // The previous sale's results.
  7602: pair("classic-motorboat", text("Vedette classique à coque bleu nuit et timonerie vernie", "Classic navy-hulled motor launch with a varnished wheelhouse")),
  7604: pair("rib-beige-cockpit", text("Semi-rigide à flotteurs noirs et sellerie beige", "RIB with black tubes and beige upholstery")),
  7606: pair("cruising-catamaran", text("Catamaran de croisière au ponton", "Cruising catamaran at the pontoon")),
  7607: pair("compact-sailboat", text("Petit croiseur à liseré rouge au ponton", "Small cruiser with a red stripe at the pontoon")),
  7609: pair("cruising-sailboat", text("Voilier de croisière avec capote bleue au ponton", "Cruising sailboat with a blue sprayhood at the pontoon")),
};

/**
 * A lot's gallery: imported photographs, else an example pair, else (for the previous sale's
 * results, DESIGN_V1_1.md DATA-1) its category image, else nothing and the placeholder shows.
 */
export function galleryFor(number: number, type: BoatType, useCategoryImage: boolean): MediaImage[] {
  const gallery = lotPhotos[number] ?? examplePairs[number];
  if (gallery) return [...gallery];
  return useCategoryImage ? [categoryImages[type]] : [];
}
