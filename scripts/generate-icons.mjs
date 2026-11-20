// Genera los íconos PNG de la PWA a partir de public/icons/icon.svg.
// Uso: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/icons/icon.svg");
const targets = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-maskable-512.png", 512],
  ["src/app/apple-icon.png", 180],
];
for (const [out, size] of targets) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("ok", out);
}
