const sharp = require('sharp');
const fs = require('fs');

async function createOgImage() {
  const width = 1200;
  const height = 630;
  
  // 1. Load the full blue logo SVG with high fidelity
  // funnels-footer-light.svg has width 2495, height 541 (ratio ~4.6:1)
  const logoBuffer = await sharp('public/brand/funnels-footer-light.svg')
    .resize({ width: 720, fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuffer).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2);

  // Clean, high-contrast crisp background with subtle brand gradient & border
  const svgBg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="50%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F0F7FF" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="#E2E8F0" stroke-width="2" rx="16" />
    </svg>
  `);

  await sharp(svgBg)
    .composite([
      { input: logoBuffer, top, left }
    ])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile('public/og-image.png');

  // Also make a JPEG version (often preferred by WhatsApp for small size & fast loading)
  await sharp(svgBg)
    .composite([
      { input: logoBuffer, top, left }
    ])
    .jpeg({ quality: 92 })
    .toFile('public/og-image.jpg');

  // Also create app/opengraph-image.png so Next.js App Router serves it natively
  await sharp(svgBg)
    .composite([
      { input: logoBuffer, top, left }
    ])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile('app/opengraph-image.png');

  const statsPng = fs.statSync('public/og-image.png');
  const statsJpg = fs.statSync('public/og-image.jpg');
  console.log('OG images created successfully!');
  console.log('PNG size:', statsPng.size, 'bytes');
  console.log('JPG size:', statsJpg.size, 'bytes');
}

createOgImage().catch(console.error);

