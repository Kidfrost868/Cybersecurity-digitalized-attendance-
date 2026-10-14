import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const svgPath = path.join(rootDir, 'public', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  // 1. 192x192 standard
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(rootDir, 'public', 'pwa-192x192.png'));

  // 2. 512x512 standard
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(rootDir, 'public', 'pwa-512x512.png'));

  // 3. 512x512 maskable (with 10% safe zone padding)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#020617',
    })
    .png()
    .toFile(path.join(rootDir, 'public', 'pwa-maskable-512x512.png'));

  // 4. Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(rootDir, 'public', 'apple-touch-icon.png'));

  // 5. Favicon 32x32 png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(rootDir, 'public', 'favicon.ico'));

  console.log('All PWA and touch icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
