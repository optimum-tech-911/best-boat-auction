import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const folder = fileURLToPath(new URL('../public/brand/', import.meta.url));

for (const name of ['wordmark', 'monogram', 'stacked']) {
  const sourcePath = resolve(folder, `${name}.png`);
  const destination = resolve(folder, `${name}.webp`);
  const result = await sharp(sourcePath).webp({ lossless: true, effort: 6 }).toFile(destination);
  const source = await sharp(sourcePath).ensureAlpha().raw().toBuffer();
  const output = await sharp(destination).ensureAlpha().raw().toBuffer();
  if (source.length !== output.length) throw new Error(`${name}: dimensions differ`);
  for (let i = 0; i < source.length; i += 4) {
    if (source[i + 3] !== output[i + 3]) throw new Error(`${name}: alpha differs`);
    // WebP may discard RGB beneath fully transparent pixels; every visible pixel stays exact.
    if (source[i + 3]) {
      for (let channel = 0; channel < 3; channel++) {
        if (source[i + channel] !== output[i + channel]) throw new Error(`${name}: visible pixel differs`);
      }
    }
  }
  console.log(`${name}: ${result.size} bytes; visible pixels and alpha preserved`);
}
