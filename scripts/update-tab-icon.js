const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const brandDir = path.join(publicDir, 'brand');
  const iconBuffer = fs.readFileSync(path.join(brandDir, 'app-icon.png'));
  const size = 512;
  const r = Math.round(size * 0.224); // Apple squircle radius ~115px

  // Create smooth squircle mask
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff" /></svg>`
  );

  const squircleIcon = await sharp(iconBuffer)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Save squircle version for tab bar / web
  await sharp(squircleIcon).toFile(path.join(brandDir, 'app-icon-squircle.png'));

  // Also create 32x32 and 48x48 favicons
  const favicon32 = await sharp(squircleIcon).resize(32, 32).png().toBuffer();
  const favicon48 = await sharp(squircleIcon).resize(48, 48).png().toBuffer();
  await sharp(squircleIcon).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated squircle tab icon and favicon.ico');
}

main().catch(console.error);
