import { text, type DemoBoat } from "./types";

/**
 * The twelve demonstration boats of DESIGN_SYSTEM.md 14.3: title, type, length, year,
 * location and start price come from the table. Beam, draught, engines and equipment carry
 * over from the earlier prototype listing of the same port and price. All values are fictional.
 */
export const octoberBoats: readonly DemoBoat[] = [
  {
    number: 7701, title: "Solenne 38", type: "sailboat", yearBuilt: 2016, lengthCm: 1140, beamCm: 385, draftCm: 195, hull: "polyester",
    engines: { count: 1, make: "Volvo Penta", powerHp: 29, hours: 1150, fuel: "diesel", drive: "saildrive" },
    berths: 6, storage: "afloat", trailerIncluded: false, city: "Lelystad", country: "NL", berth: { latitude: 52.516, longitude: 5.4367 },
    startEuros: 62_000, reserveEuros: 68_000, marketEuros: 78_500, gallery: "full",
    description: text(
      "Un croiseur de 11,40 m à trois cabines, entretenu par son deuxième propriétaire et navigué sur l’IJsselmeer et la mer des Wadden. Coque blanche à liseré bleu marine, cockpit en teck, double barre à roue. Les membranes du saildrive et les supports moteur ont été remplacés en 2024.",
      "An 11.40 m three-cabin cruiser, kept by her second owner and sailed on the IJsselmeer and the Wadden Sea. White hull with a navy boot stripe, teak cockpit and twin wheels. The saildrive diaphragm and engine mounts were replaced in 2024.",
    ),
    pointsOfAttention: [text("Le génois montre de l’usure le long de la chute.", "The genoa shows wear along the leech.")],
    equipment: {
      rigging: [text("Grand-voile sur enrouleur de mât", "In-mast furling mainsail"), text("Génois sur enrouleur", "Furling genoa")],
      navigation: [text("Instruments de navigation complets", "Full navigation instruments"), text("Pilote automatique", "Autopilot")],
      deck: [text("Guindeau électrique", "Electric windlass"), text("Capote et bimini", "Sprayhood and bimini"), text("Propulseur d’étrave", "Bow thruster")],
      comfort: [text("Trois cabines doubles", "Three double cabins"), text("Prise de quai", "Shore power")],
    },
  },
  {
    number: 7702, title: "Kerlys 31", type: "sailboat", yearBuilt: 1998, lengthCm: 940, beamCm: 300, draftCm: 150, hull: "polyester",
    engines: { count: 1, make: "Yanmar", powerHp: 27, hours: 1900, fuel: "diesel", drive: "inboard" },
    berths: 5, storage: "afloat", trailerIncluded: false, city: "La Trinité-sur-Mer", country: "FR", berth: { latitude: 47.5884, longitude: -3.0261 },
    startEuros: 14_500, reserveEuros: null, marketEuros: 19_800, gallery: "short",
    description: text(
      "Un croiseur classique de la fin des années 1990, coque crème et listons vernis, gréé pour naviguer en équipage réduit. Barre franche, housses de voiles bleues, moteur diesel révisé chaque hiver par le même chantier.",
      "A classic late-1990s cruiser with a cream hull and varnished toe-rails, rigged for short-handed sailing. Tiller steering, blue sail covers and a diesel engine serviced every winter by the same yard.",
    ),
    pointsOfAttention: [text("Le pont en teck du cockpit est à reprendre par endroits.", "The cockpit teak needs attention in places.")],
    equipment: {
      rigging: [text("Génois sur enrouleur", "Furling genoa"), text("Lazy-bag", "Lazy bag")],
      navigation: [text("Sondeur", "Depth sounder"), text("Radio VHF", "VHF radio")],
      comfort: [text("Chauffage diesel", "Diesel heater"), text("Intérieur en teck", "Teak interior")],
      deck: [text("Capote", "Sprayhood")],
    },
  },
  {
    number: 7703, title: "Ondine 24", type: "sailboat", yearBuilt: 2021, lengthCm: 730, beamCm: 255, draftCm: 135, hull: "polyester",
    engines: { count: 1, make: "ePropulsion", powerHp: 3, hours: 60, fuel: "electric", drive: "outboard" },
    berths: 2, storage: "ashore", trailerIncluded: true, city: "Annecy", country: "FR", berth: { latitude: 45.8952, longitude: 6.1351 },
    startEuros: 34_000, reserveEuros: 36_000, marketEuros: 41_500, isNew: true, gallery: "short",
    description: text(
      "Un daysailer moderne, rapide et facile à mener en solitaire, entièrement électrique. Mât carbone, voiles grises, cockpit ouvert à barre franche. La batterie au lithium se recharge au ponton.",
      "A modern daysailer, quick and easy to sail single-handed, fully electric. Carbon mast, grey sails and an open cockpit with tiller steering. The lithium battery charges from shore power.",
    ),
    pointsOfAttention: [text("Légères éraflures sur le sac du code 0.", "Minor scuffs on the code 0 bag.")],
    equipment: {
      rigging: [text("Foc autovireur", "Self-tacking jib"), text("Code 0 sur enrouleur", "Code 0 on furler")],
      deck: [text("Barre franche en carbone", "Carbon tiller")],
      general: [text("Remorque routière", "Road trailer")],
    },
  },
  {
    number: 7704, title: "Vigie 36 Steel", type: "motorboat", yearBuilt: 2005, lengthCm: 1080, beamCm: 365, draftCm: 105, hull: "steel",
    engines: { count: 1, make: "Volvo Penta", powerHp: 150, hours: 2850, fuel: "diesel", drive: "inboard" },
    berths: 6, storage: "afloat", trailerIncluded: false, city: "Roermond", country: "NL", berth: { latitude: 51.1989, longitude: 5.9698 },
    startEuros: 89_000, reserveEuros: 98_000, marketEuros: 112_000, gallery: "full",
    description: text(
      "Un croiseur à moteur néerlandais en acier, coque bleu nuit et superstructure blanche, avec une cabine arrière. Un bateau confortable pour vivre à bord sur les fleuves et les canaux. Historique d’entretien complet en chantier.",
      "A Dutch steel motor cruiser with a dark navy hull, white superstructure and an aft cabin. A comfortable liveaboard for rivers and canals, with a full yard service history.",
    ),
    pointsOfAttention: [text("Le calfatage du teck des passavants est à reprendre par endroits.", "The side-deck teak needs re-caulking in places.")],
    equipment: {
      engine: [text("Propulseurs d’étrave et de poupe", "Bow and stern thrusters"), text("Convertisseur", "Inverter")],
      navigation: [text("Radar et traceur", "Radar and chartplotter"), text("Pilote automatique", "Autopilot")],
      comfort: [text("Chauffage", "Heating"), text("Cabine arrière", "Aft cabin")],
      deck: [text("Plateforme de bain", "Swim platform"), text("Taud de cockpit", "Cockpit cover")],
    },
  },
  {
    number: 7705, title: "Rivage 42 Fly", type: "motorboat", yearBuilt: 2007, lengthCm: 1300, beamCm: 400, draftCm: 100, hull: "polyester",
    engines: { count: 2, make: "Volvo Penta", powerHp: 370, hours: 1100, fuel: "diesel", drive: "inboard" },
    berths: 6, storage: "afloat", trailerIncluded: false, city: "Hellevoetsluis", country: "NL", berth: { latitude: 51.8224, longitude: 4.1238 },
    startEuros: 118_000, reserveEuros: 132_000, marketEuros: 128_000, gallery: "short",
    description: text(
      "Un yacht à moteur de 13 m avec flybridge, deux cabines doubles et un carré lumineux. Groupe électrogène, climatisation et plateforme de bain, pour croiser le long des côtes de la mer du Nord.",
      "A 13 m flybridge motor yacht with two double cabins and a bright saloon. Generator, air conditioning and a swim platform, for coastal cruising on the North Sea.",
    ),
    pointsOfAttention: [text("Les vernis intérieurs du carré sont à rafraîchir.", "The saloon’s interior varnish needs refreshing.")],
    equipment: {
      general: [text("Flybridge avec bimini", "Flybridge with bimini")],
      engine: [text("Groupe électrogène", "Generator"), text("Propulseur d’étrave", "Bow thruster")],
      comfort: [text("Climatisation", "Air conditioning"), text("Deux cabines doubles", "Two double cabins")],
      deck: [text("Plateforme de bain", "Swim platform")],
    },
  },
  {
    number: 7706, title: "Pêcheur 7.0", type: "motorboat", yearBuilt: 2019, lengthCm: 690, beamCm: 254, draftCm: 50, hull: "polyester",
    engines: { count: 1, make: "Yamaha", powerHp: 150, hours: 310, fuel: "petrol", drive: "outboard" },
    berths: 2, storage: "afloat", trailerIncluded: false, city: "La Rochelle", country: "FR", berth: { latitude: 46.1468, longitude: -1.1668 },
    startEuros: 29_500, reserveEuros: 31_000, marketEuros: 38_200, gallery: "short",
    description: text(
      "Un bateau de pêche-promenade avec timonerie, polyvalent pour l’Atlantique et les sorties en famille. Moteur hors-bord de 150 ch à faibles heures, porte-cannes et vivier.",
      "A walkaround fishing boat with a wheelhouse, versatile for the Atlantic and family days out. Low-hour 150 hp outboard, rod holders and a live bait well.",
    ),
    pointsOfAttention: [],
    equipment: {
      navigation: [text("Sondeur de pêche", "Fishfinder"), text("Radio VHF", "VHF radio")],
      deck: [text("Porte-cannes", "Rod holders"), text("Vivier à appâts", "Live bait well"), text("Guindeau électrique", "Electric windlass")],
    },
  },
  {
    number: 7707, title: "Strada 580 Open", type: "speedboat", yearBuilt: 2015, lengthCm: 580, beamCm: 230, draftCm: 35, hull: "polyester",
    engines: { count: 1, make: "Yamaha", powerHp: 115, hours: 420, fuel: "petrol", drive: "outboard" },
    berths: 0, storage: "afloat", trailerIncluded: true, city: "Nieuwpoort", country: "BE", berth: { latitude: 51.1406, longitude: 2.7408 },
    startEuros: 14_000, reserveEuros: 16_000, marketEuros: 19_400, gallery: "short",
    description: text(
      "Un open à console centrale, blanc, pour la promenade et la pêche côtière : banquette avant, siège pilote double et pare-brise. Moteur révisé en 2025, remorque de route incluse.",
      "A white centre-console open boat for day trips and coastal fishing: bow seating, a double helm seat and a windscreen. Engine serviced in 2025, road trailer included.",
    ),
    pointsOfAttention: [text("Quelques rayures sur le pont avant.", "A few scratches on the foredeck.")],
    equipment: {
      navigation: [text("GPS et sondeur", "GPS and depth sounder")],
      deck: [text("Taud de console", "Console cover"), text("Échelle de bain", "Swim ladder")],
      general: [text("Remorque de route", "Road trailer")],
    },
  },
  {
    number: 7708, title: "Lago 750", type: "speedboat", yearBuilt: 2016, lengthCm: 750, beamCm: 249, draftCm: 80, hull: "polyester",
    engines: { count: 1, make: "Volvo Penta", powerHp: 300, hours: 280, fuel: "petrol", drive: "sterndrive" },
    berths: 2, storage: "indoors", trailerIncluded: true, city: "Gmunden", country: "AT", berth: { latitude: 47.9165, longitude: 13.8056 },
    startEuros: 65_000, reserveEuros: 70_000, marketEuros: 81_500, gallery: "short",
    description: text(
      "Un runabout de lac au style classique, finitions à la main, pont d’aspect acajou et sellerie crème. Hiverné à l’intérieur et entretenu chaque saison en chantier.",
      "A classic-style lake runabout, hand-finished, with a mahogany-look deck and cream upholstery. Winter-stored indoors and yard-serviced every season.",
    ),
    pointsOfAttention: [],
    equipment: {
      deck: [text("Pont en teck", "Teak deck"), text("Bain de soleil", "Sun lounger"), text("Bimini", "Bimini")],
      comfort: [text("Audio Bluetooth", "Bluetooth audio")],
      general: [text("Remorque double essieu", "Tandem trailer")],
    },
  },
  {
    number: 7709, title: "Tern 670", type: "rib", yearBuilt: 2022, lengthCm: 670, beamCm: 255, draftCm: 45, hull: "hypalon",
    engines: { count: 1, make: "Honda", powerHp: 150, hours: 120, fuel: "petrol", drive: "outboard" },
    berths: 0, storage: "ashore", trailerIncluded: true, city: "Vlissingen", country: "NL", berth: { latitude: 51.441, longitude: 3.5761 },
    startEuros: 27_000, reserveEuros: 29_000, marketEuros: 36_200, isNew: true, gallery: "full",
    description: text(
      "Un semi-rigide presque neuf, rapide et sec, pour le delta de Zélande. Flotteurs gris en Hypalon, console centrale blanche avec pare-brise, arceau inox. Seulement 120 heures moteur.",
      "A nearly new RIB, fast and dry, for the Zeeland delta. Grey Hypalon tubes, a white centre console with windscreen and a stainless ski arch. Only 120 engine hours.",
    ),
    pointsOfAttention: [],
    equipment: {
      general: [text("Flotteurs en Hypalon", "Hypalon tubes"), text("Remorque routière", "Road trailer")],
      navigation: [text("Écran de console", "Console display")],
      deck: [text("Arceau de ski nautique", "Ski arch"), text("Bain de soleil", "Sun pad")],
    },
  },
  {
    number: 7710, title: "Calanque 750", type: "rib", yearBuilt: 2017, lengthCm: 750, beamCm: 294, draftCm: 50, hull: "hypalon",
    engines: { count: 1, make: "Suzuki", powerHp: 250, hours: 420, fuel: "petrol", drive: "outboard" },
    berths: 2, storage: "afloat", trailerIncluded: false, city: "Antibes", country: "FR", berth: { latitude: 43.5868, longitude: 7.1287 },
    startEuros: 24_000, reserveEuros: 25_500, marketEuros: 28_500, gallery: "short",
    description: text(
      "Un semi-rigide avec une petite cabine pour deux, rapide et sec, pour les sorties à la journée sur la Côte d’Azur. Révision annuelle en concession, factures disponibles.",
      "A RIB with a small cuddy cabin for two, fast and dry, for day trips on the Riviera. Annual dealer service with invoices.",
    ),
    pointsOfAttention: [text("Les flotteurs sont décolorés par le soleil, sans fuite signalée.", "UV fading on the tubes; no leaks reported.")],
    equipment: {
      navigation: [text("Traceur de cartes", "Chartplotter"), text("Radio VHF", "VHF radio")],
      comfort: [text("Cabine avec couchage", "Cuddy cabin with berth")],
      deck: [text("Bimini", "Bimini"), text("Bain de soleil avant", "Bow sun pad")],
    },
  },
  {
    number: 7711, title: "Grachten 8.8", type: "sloep", yearBuilt: 2017, lengthCm: 880, beamCm: 290, draftCm: 85, hull: "polyester",
    engines: { count: 1, make: "Volvo Penta", powerHp: 150, hours: 420, fuel: "diesel", drive: "sterndrive" },
    berths: 2, storage: "afloat", trailerIncluded: false, city: "Muiden", country: "NL", berth: { latitude: 52.333, longitude: 5.0707 },
    startEuros: 75_000, reserveEuros: 82_000, marketEuros: 93_500, gallery: "full",
    description: text(
      "Une sloep de luxe à cockpit ouvert : assez grande pour l’IJsselmeer, assez compacte pour les canaux. Coque bleu nuit, pont en teck, coussins crème et capote repliable. Diesel avec embase à double hélice.",
      "A luxury open sloep: big enough for the IJsselmeer, small enough for the canals. Deep navy hull, teak deck, cream cushions and a folding canopy. Diesel with a duoprop drive.",
    ),
    pointsOfAttention: [],
    equipment: {
      deck: [text("Pont en teck", "Teak deck"), text("Taud", "Canopy"), text("Plateforme de bain", "Swim platform")],
      engine: [text("Propulseur d’étrave", "Bow thruster")],
      comfort: [text("Chauffage", "Heating")],
    },
  },
  {
    number: 7712, title: "Alizé 40", type: "catamaran", yearBuilt: 2012, lengthCm: 1180, beamCm: 653, draftCm: 115, hull: "polyester",
    engines: { count: 2, make: "Yanmar", powerHp: 29, hours: 2400, fuel: "diesel", drive: "saildrive" },
    berths: 8, storage: "afloat", trailerIncluded: false, city: "Sukošan", country: "HR", berth: { latitude: 44.0526, longitude: 15.3005 },
    startEuros: 135_000, reserveEuros: 145_000, marketEuros: 168_000, gallery: "short",
    description: text(
      "Un catamaran de croisière en version propriétaire, prêt pour l’Adriatique : grand carré vitré, bimini sur le cockpit, autonomie en énergie et en eau. Les deux saildrives ont été révisés en 2025.",
      "A cruising catamaran in the owner’s version, ready for the Adriatic: a large glazed saloon, a bimini over the cockpit and self-sufficient in power and water. Both saildrives were serviced in 2025.",
    ),
    pointsOfAttention: [text("Le trampoline est à remplacer.", "The trampoline is due for replacement.")],
    equipment: {
      engine: [text("Panneaux solaires de 800 W", "800 W solar panels"), text("Groupe électrogène", "Generator"), text("Batteries de service au lithium", "Lithium house bank")],
      navigation: [text("Pilote automatique", "Autopilot")],
      comfort: [text("Dessalinisateur", "Watermaker"), text("Quatre cabines", "Four cabins")],
      deck: [text("Bossoirs avec annexe", "Davits with tender")],
    },
  },
];
