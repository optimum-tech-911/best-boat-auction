import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// Explicit source filenames avoid changing associations when folders are re-sorted.
// Only web format conversion is applied; originals and the image content are preserved.
const boatPairs = [
  ["open-motorboat", "19_10_41-1", "19_10_46-1"],
  ["rib-beige-cockpit", "19_10_42-2", "19_10_47-2"],
  ["compact-sailboat", "19_10_43-3", "19_10_48-3"],
  ["cruising-sailboat", "19_10_44-4", "19_10_49-4"],
  ["daysailer", "19_10_46-5", "19_10_51-5"],
  ["cabin-motorboat", "19_10_47-6", "19_10_52-6"],
  ["cruising-catamaran", "19_10_48-7", "19_10_53-7"],
  ["open-launch", "19_10_49-8", "19_10_55-8"],
  ["rib-grey-console", "19_10_51-9", "19_10_56-9"],
  ["classic-motorboat", "19_10_53-10", "19_10_57-10"],
];
const editorial = [
  ["owner-mooring", "18_43_20-1"], ["motor-yacht", "18_43_21-2"],
  ["sailing-yacht", "18_43_22-3"], ["sports-motorboat", "18_43_23-4"],
  ["rib-underway", "18_43_25-6"], ["catamaran-at-anchor", "18_43_26-7"],
  ["boat-viewing", "18_43_27-8"], ["boat-handover", "18_43_28-9"],
  ["marina-at-sunset", "18_43_29-10"],
];
const recipes = [
  ...boatPairs.flatMap(([name, first, second]) => [first, second].map((source, view) => ({
    source: `the boats examplers/Image ChatGPT 5 oct. 2026, ${source}.png`,
    publicPath: `/images/boats/examples/${name}-${view + 1}.webp`,
  }))),
  ...editorial.map(([name, source]) => ({
    source: `images/Image ChatGPT 5 oct. 2026, ${source}.png`,
    publicPath: `/images/editorial/${name}.webp`,
  })),
];

const manifest = [];
for (const recipe of recipes) {
  const source = await readFile(path.join(root, recipe.source));
  const metadata = await sharp(source).metadata();
  const destination = path.join(root, "apps/web/public", recipe.publicPath);
  await mkdir(path.dirname(destination), { recursive: true });
  const result = await sharp(source).webp({ quality: 90, effort: 6 }).toFile(destination);
  manifest.push({ ...recipe, width: metadata.width, height: metadata.height,
    originalSha256: createHash("sha256").update(source).digest("hex"),
    originalBytes: source.length, webBytes: result.size });
}
await writeFile(path.join(root, "assets/supplied-media.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const originalBytes = manifest.reduce((total, image) => total + image.originalBytes, 0);
const webBytes = manifest.reduce((total, image) => total + image.webBytes, 0);
console.log(`Imported ${manifest.length} supplied images: ${(originalBytes / 1e6).toFixed(1)} MB → ${(webBytes / 1e6).toFixed(1)} MB. Originals unchanged.`);
