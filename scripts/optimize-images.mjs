// Converts the original photographs in raw/ into web-ready WebP files in public/img/.
// Originals are not committed (see .gitignore); re-run `npm run images` after adding new ones.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const out = 'public/img';
mkdirSync(out, { recursive: true });

const jobs = [
  // Actual photographs of the owner, Krishnam Raju
  // 1.png / 2.png are Instagram screenshots: crop off the carousel arrows and page dots
  { src: 'raw/1.png', name: 'owner-car', width: 640, crop: { left: 44, top: 0, width: 584, height: 866 } },
  { src: 'raw/2.png', name: 'owner-event', width: 640, crop: { left: 42, top: 0, width: 597, height: 865 } },
  { src: 'raw/4.png', name: 'owner-portrait', width: 600 },
  // Promotional visuals (not photographs of R.K CAR WASH work)
  { src: 'raw/7.png', name: 'promo-red-car', width: 800 },
  { src: 'raw/5.png', name: 'promo-foam', width: 1024 },
  { src: 'raw/6.png', name: 'promo-suv', width: 1536 },
  { src: 'raw/6.png', name: 'promo-suv-sm', width: 800 },
  { src: 'raw/5.png', name: 'promo-foam-sm', width: 640 },
];

for (const j of jobs) {
  let img = sharp(j.src);
  if (j.crop) img = img.extract(j.crop);
  const info = await img
    .resize({ width: j.width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${out}/${j.name}.webp`);
  console.log(`${j.name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
}

// Open Graph share image (1200x630)
await sharp('raw/7.png')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82 })
  .toFile(`${out}/og.jpg`);
console.log('og.jpg 1200x630');
