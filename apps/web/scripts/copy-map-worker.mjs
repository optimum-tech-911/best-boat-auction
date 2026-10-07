/**
 * Copies MapLibre's tile worker next to the site's static files. MapLibre 6 loads it from beside its
 * own module, which a bundled build does not keep, so the map points to this copy instead.
 * Runs before `dev` and `build`; the version in the file name follows the installed package.
 */
import { copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = path.dirname(require.resolve("maplibre-gl/package.json", { paths: [app] }));
const { version } = JSON.parse(await readFile(path.join(packageDir, "package.json"), "utf8"));
const target = path.join(app, "public/vendor/maplibre");
await mkdir(target, { recursive: true });
for (const file of await readdir(target)) if (file !== `maplibre-gl-worker-${version}.mjs`) await rm(path.join(target, file));
await copyFile(path.join(packageDir, "dist/maplibre-gl-worker.mjs"), path.join(target, `maplibre-gl-worker-${version}.mjs`));
console.log(`MapLibre worker ${version} ready.`);
