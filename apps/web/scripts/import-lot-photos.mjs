/**
 * Imports lot photographs into the maquette.
 *
 *   pnpm --filter @bba/web exec node scripts/import-lot-photos.mjs
 *
 * Reads the supplied folders in "bestboatauction boats/" (one per boat, files 01-cover, 02-angle,
 * 03-detail…), writes WebP derivatives to public/images/lots/<number>-<slug>/, records every source
 * in assets/lot-photos.json and generates the typed gallery map used by the demonstration backend.
 * Originals are never modified. Add a folder and a row to `assignments` to illustrate another lot;
 * a row whose folder does not exist yet is skipped, and the lot keeps its current illustration.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourceRoot = path.join(root, "bestboatauction boats");
const publicRoot = path.join(root, "apps/web/public/images/lots");
const MAX_WIDTH = 2000;

/** Which lot each supplied folder illustrates, and what each photograph shows. */
const assignments = [
  { folder: "bavaria-cruiser-37", lot: 7701, slug: "solenne-38", shots: {
    "01-cover": ["Voilier de croisière au mouillage", "Cruising sailboat at anchor", "50% 55%"],
    "02-angle": ["Le pont et la capote, vus de l’avant", "Deck and sprayhood seen from the bow", "50% 50%"],
    "03-detail": ["Le carré et sa table", "Saloon and table", "50% 55%"],
  } },
  { folder: "hallberg-rassy-312", lot: 7702, slug: "kerlys-31", shots: {
    "01-cover": ["Voilier classique sous spinnaker", "Classic sailboat under spinnaker", "45% 60%"],
    "02-angle": ["Voilier au mouillage dans une crique rocheuse", "Sailboat moored in a rocky cove", "50% 45%"],
    "03-detail": ["Le carré boisé et ses banquettes bleues", "Wooden saloon with blue settees", "50% 50%"],
  } },
  { folder: "jeanneau-merry-fisher-695", lot: 7706, slug: "pecheur-7-0", shots: {
    "01-cover": ["Bateau de pêche-promenade avec timonerie, à quai", "Walkaround fishing boat with wheelhouse, alongside", "45% 65%"],
    "02-angle": ["L’avant et le toit de la timonerie", "Foredeck and wheelhouse roof", "55% 55%"],
    "03-detail": ["Le poste de pilotage dans la timonerie", "Helm station inside the wheelhouse", "60% 50%"],
  } },
  { folder: "zodiac-medline-7-5", lot: 7710, slug: "calanque-750", shots: {
    "01-cover": ["Semi-rigide en navigation près de la côte", "RIB underway near the coast", "40% 60%"],
    "02-angle": ["Le cockpit et le bain de soleil, au ponton", "Cockpit and sun pad at the pontoon", "50% 55%"],
    "03-detail": ["La banquette et la table du cockpit", "Cockpit seating and table", "45% 60%"],
  } },
  { folder: "lagoon-380", lot: 7712, slug: "alize-40", shots: {
    "01-cover": ["Catamaran de croisière dans une baie", "Cruising catamaran in a bay", "50% 60%"],
    "02-angle": ["Catamaran au mouillage devant la plage", "Catamaran at anchor off the beach", "50% 72%"],
    "03-detail": ["Le carré et la cuisine", "Saloon and galley", "50% 60%"],
  } },
  { folder: "etap-21i", lot: 7601, slug: "brisane-21", shots: {
    "01-cover": ["Petit croiseur sur sa remorque", "Small cruiser on its trailer", "40% 55%"],
    "02-angle": ["Le voilier amarré au ponton", "The sailboat moored at the pontoon", "45% 60%"],
    "03-detail": ["La cuisine et les couchettes", "Galley and berths", "50% 50%"],
  } },
  { folder: "interboat-22-classic", lot: 7605, slug: "noordmeer-6-7", shots: {
    "01-cover": ["Sloep classique à coque crème, à terre", "Classic cream-hulled sloep, ashore", "50% 60%"],
    "02-angle": ["La sloep de trois quarts arrière", "The sloep from the rear quarter", "50% 60%"],
    "03-detail": ["La poupe et le liston en cordage", "Stern and rope fender", "50% 50%"],
  } },
  { folder: "terhi-450", lot: 7610, slug: "rumbelo-450", shots: {
    "01-cover": ["Petit bateau à moteur ouvert en navigation", "Small open motorboat underway", "45% 60%"],
    "02-angle": ["Le bateau de profil, moteur hors-bord", "Side view with its outboard", "45% 60%"],
    "03-detail": ["Le bateau de trois quarts arrière", "Rear three-quarter view", "50% 55%"],
  } },
  // Waiting for the client's own photographs (docs/design/PHOTO_SHOT_LIST.md); imported once the folder exists.
  { folder: "rivage-42-fly", lot: 7705, slug: "rivage-42-fly", shots: {
    "01-cover": ["Yacht à moteur à flybridge de 13 m à quai", "13 m flybridge motor yacht alongside", "50% 55%"],
    "02-angle": ["Le flybridge et le poste de pilotage extérieur", "The flybridge and outside helm", "50% 50%"],
    "03-detail": ["Le carré lumineux et la cuisine", "The bright saloon and galley", "50% 55%"],
  } },
  { folder: "lago-750", lot: 7708, slug: "lago-750", shots: {
    "01-cover": ["Runabout de lac au pont façon acajou", "Lake runabout with a mahogany-look deck", "50% 60%"],
    "02-angle": ["Le cockpit et la sellerie crème", "Cockpit and cream upholstery", "50% 55%"],
    "03-detail": ["Le tableau de bord et le volant", "Dashboard and steering wheel", "50% 50%"],
  } },
  { folder: "belvaro-9", lot: 7603, slug: "belvaro-9", shots: {
    "01-cover": ["Vedette sportive de 9 m sur le lac", "9 m sports boat on the lake", "50% 60%"],
    "02-angle": ["La vedette de trois quarts arrière", "Rear three-quarter view", "50% 55%"],
    "03-detail": ["Le cockpit et le bain de soleil", "Cockpit and sun pad", "50% 55%"],
  } },
  { folder: "ostrea-44", lot: 7608, slug: "ostrea-44", shots: {
    "01-cover": ["Yacht à moteur à flybridge de 13,50 m au port", "13.50 m flybridge motor yacht in the marina", "50% 55%"],
    "02-angle": ["Le cockpit arrière et la plateforme de bain", "Aft cockpit and swim platform", "50% 55%"],
    "03-detail": ["Le carré et ses banquettes", "Saloon and settees", "50% 55%"],
  } },
];

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) rows.push([...row, field]);
  const [header, ...data] = rows;
  return data.filter((cells) => cells.length > 1).map((cells) => Object.fromEntries(header.map((name, index) => [name.replace(/^﻿/, ""), cells[index] ?? ""])));
}

const sources = new Map(parseCsv(await readFile(path.join(sourceRoot, "SOURCES.csv"), "utf8")).map((row) => [row.filename, row]));
await rm(publicRoot, { recursive: true, force: true });

const galleries = {};
const records = [];
const imported = [];
for (const assignment of assignments) {
  const folder = path.join(sourceRoot, assignment.folder);
  if (!existsSync(folder)) {
    console.log(`Waiting for "${assignment.folder}/" (lot ${assignment.lot}): skipped.`);
    continue;
  }
  imported.push(assignment.lot);
  const files = (await readdir(folder)).filter((file) => /\.(jpe?g|png|webp)$/i.test(file)).sort();
  const target = path.join(publicRoot, `${assignment.lot}-${assignment.slug}`);
  await mkdir(target, { recursive: true });
  galleries[assignment.lot] = [];
  for (const [index, file] of files.entries()) {
    const shot = file.replace(/\.[^.]+$/, "");
    const [fr, en, focalPoint] = assignment.shots[shot] ?? ["Vue du bateau", "View of the boat", "50% 50%"];
    const original = await readFile(path.join(folder, file));
    const output = `${String(index + 1).padStart(2, "0")}.webp`;
    const info = await sharp(original).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(target, output));
    const src = `/images/lots/${assignment.lot}-${assignment.slug}/${output}`;
    galleries[assignment.lot].push({ src, width: info.width, height: info.height, focalPoint, alt: { fr, en } });
    const source = sources.get(`${assignment.folder}/${file}`) ?? {};
    records.push({
      lot: assignment.lot,
      public: src,
      original: `bestboatauction boats/${assignment.folder}/${file}`,
      sha256: createHash("sha256").update(original).digest("hex"),
      model: source.boat_model ?? null,
      sourceWebsite: source.source_website ?? null,
      sourceUrl: source.source_url ?? null,
      copyright: source.visible_licensing_copyright ?? null,
      licence: source.reuse_license ?? null,
      bytes: { original: original.length, webp: info.size },
    });
  }
}

await writeFile(path.join(root, "assets/lot-photos.json"), `${JSON.stringify({ imported: new Date().toISOString().slice(0, 10), records }, null, 2)}\n`);
await writeFile(
  path.join(root, "packages/sdk/src/demo/data/lot-photos.generated.ts"),
  `// Generated by apps/web/scripts/import-lot-photos.mjs. Do not edit by hand.\n` +
  `import type { MediaImage } from "@bba/contracts";\n\n` +
  `export const lotPhotos: Readonly<Record<number, readonly MediaImage[]>> = ${JSON.stringify(galleries, null, 2)};\n`,
);
console.log(`${records.length} photographs imported for ${imported.length} lots.`);
