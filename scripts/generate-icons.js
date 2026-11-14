const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Extracts and cleans the pure Funnel mark from custom-logo-light.png,
 * cleanly removing the overlapping vertical stem of the black letter 'u'.
 */
async function getCleanOriginalMark() {
  const sourcePath = path.join(__dirname, '..', 'public', 'brand', 'custom-logo-light.png');
  const { data, info } = await sharp(sourcePath)
    .extract({ left: 0, top: 0, width: 501, height: 541 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Mask out the overlapping stem of the letter 'u' (charcoal text at x > 380, y > 120)
  for (let y = 120; y < info.height; y++) {
    for (let x = 380; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // If it's part of the black text (not the vibrant blue funnel mark)
      if (a > 0 && (b < 90 || (b - r) < 30)) {
        data[idx + 3] = 0; // Make 100% transparent
      }
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Generates an authentic Apple-style Liquid Glass icon
 */
async function generateAppleLiquidGlassIcon(canvasSize = 512) {
  const targetH = Math.round(canvasSize * 0.66); // 66% Apple HIG Keyline ratio
  
  // 1. Get the pure, clean original mark (no letter 'u' artifact)
  const cleanMarkBuffer = await getCleanOriginalMark();

  // Resize mark to target height while preserving exact aspect ratio
  const markResized = await sharp(cleanMarkBuffer)
    .resize({ height: targetH, fit: 'contain' })
    .toBuffer();

  const markMeta = await sharp(markResized).metadata();
  const markW = markMeta.width;
  const markH = markMeta.height;

  // Position: Centered horizontally, +optical downward offset (~1.6%)
  const posX = Math.round((canvasSize - markW) / 2);
  const posY = Math.round((canvasSize - markH) / 2 + (canvasSize * 0.016));

  // 2. Build Seamless Extended Padding for Natural Blur Dispersion
  const pad = Math.round(canvasSize * 0.12);
  const paddedMark = await sharp(markResized)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const resScale = canvasSize / 512;

  // Layer A: Colored Caustic Bounce Shadow (Apple liquid colored glow cast on white tile)
  const causticShadow = await sharp(paddedMark)
    .tint({ r: 0, g: 90, b: 175 })
    .linear([1, 1, 1, 0.28], [0, 0, 0, 0])
    .blur(Math.max(1, Math.round(16 * resScale)))
    .png()
    .toBuffer();

  // Layer B: Ambient Depth Shadow (Navy depth shadow)
  const depthShadow = await sharp(paddedMark)
    .tint({ r: 0, g: 25, b: 60 })
    .linear([1, 1, 1, 0.18], [0, 0, 0, 0])
    .blur(Math.max(1, Math.round(7 * resScale)))
    .png()
    .toBuffer();

  // Layer C: Crisp Contact Lip Shadow (tight contact shadow)
  const contactLip = await sharp(paddedMark)
    .tint({ r: 0, g: 15, b: 35 })
    .linear([1, 1, 1, 0.14], [0, 0, 0, 0])
    .blur(Math.max(0.5, 2.5 * resScale))
    .png()
    .toBuffer();

  // 3. Apple-Style Ultra-Fine Specular Rim Highlight (delicate glass edge refraction)
  const rimStroke = (2 * resScale).toFixed(2);
  const rimSvg = `
  <svg width="${markW}" height="${markH}" viewBox="0 0 500 540">
    <defs>
      <linearGradient id="appleRimGrad" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.80" />
        <stop offset="25%" stop-color="#FFFFFF" stop-opacity="0.30" />
        <stop offset="60%" stop-color="#BAE6FD" stop-opacity="0.10" />
        <stop offset="100%" stop-color="#001428" stop-opacity="0.25" />
      </linearGradient>
    </defs>
    <path d="M 88.539 1.112 C 67.269 4.211, 45.272 15.394, 29.940 30.903 C 21.022 39.924, 15.317 48.033, 9.967 59.294 C 4.121 71.599, 1.065 83.391, 0.759 94.831 L 0.500 104.500 196.500 104.791 C 326.942 104.984, 396.202 104.733, 403.567 104.039 C 409.654 103.466, 418.204 102.067, 422.567 100.931 C 432.582 98.322, 447.233 91.436, 455.852 85.288 C 475.477 71.286, 490.643 49.311, 496.447 26.464 C 498.184 19.625, 499.951 8.016, 499.980 3.250 L 500 0 297.250 0.122 C 185.738 0.189, 91.818 0.635, 88.539 1.112" fill="none" stroke="url(#appleRimGrad)" stroke-width="${rimStroke}" />
    <path d="M 48.598 218.842 C 48.232 219.433, 57.546 242.999, 69.296 271.209 L 90.659 322.500 201.580 322.494 L 312.500 322.488 322.277 319.795 C 341.532 314.490, 359.712 303.635, 372.555 289.772 C 383.248 278.230, 392.209 262.514, 396.441 247.881 C 397.803 243.170, 401.274 219.872, 400.686 219.385 C 400.584 219.300, 321.472 218.901, 224.881 218.498 C 99.931 217.978, 49.071 218.077, 48.598 218.842" fill="none" stroke="url(#appleRimGrad)" stroke-width="${(1.8 * resScale).toFixed(2)}" />
    <path d="M 138.994 437.750 C 138.991 438.163, 148.554 461.607, 160.244 489.848 L 181.500 541.197 190.500 540.632 C 206.811 539.608, 223.715 533.931, 237.790 524.752 C 246.967 518.767, 259.514 506.871, 265.595 498.390 C 271.337 490.381, 277.206 478.448, 280.295 468.500 C 282.854 460.257, 285.684 439.917, 284.532 438.051 C 284.087 437.332, 261.018 437, 211.441 437 C 171.598 437, 138.998 437.337, 138.994 437.750" fill="none" stroke="url(#appleRimGrad)" stroke-width="${(1.6 * resScale).toFixed(2)}" />
  </svg>`;

  const rimOverlay = await sharp(Buffer.from(rimSvg))
    .resize({ width: markW, height: markH })
    .png()
    .toBuffer();

  // 4. Base Plate: Apple Silky White Squircle Surface
  const basePlateSvg = `
  <svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
    <defs>
      <radialGradient id="plateGrad" cx="30%" cy="20%" r="85%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="65%" stop-color="#FCFDFF" />
        <stop offset="100%" stop-color="#F2F5F9" />
      </radialGradient>
    </defs>
    <rect width="${canvasSize}" height="${canvasSize}" fill="url(#plateGrad)" />
    <rect x="0.5" y="0.5" width="${canvasSize - 1}" height="${canvasSize - 1}" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.9" />
    <rect x="1.5" y="1.5" width="${canvasSize - 3}" height="${canvasSize - 3}" fill="none" stroke="#003366" stroke-width="0.75" stroke-opacity="0.03" />
  </svg>`;

  const basePlate = await sharp(Buffer.from(basePlateSvg)).png().toBuffer();

  // 5. Composite everything in true 3D visual order
  const dyCaustic = Math.round(12 * resScale);
  const dyDepth = Math.round(6 * resScale);
  const dyLip = Math.round(2 * resScale);

  const finalIcon = await sharp(basePlate)
    .composite([
      {
        input: causticShadow,
        top: posY - pad + dyCaustic,
        left: posX - pad,
        blend: 'over'
      },
      {
        input: depthShadow,
        top: posY - pad + dyDepth,
        left: posX - pad,
        blend: 'over'
      },
      {
        input: contactLip,
        top: posY - pad + dyLip,
        left: posX - pad,
        blend: 'over'
      },
      {
        input: markResized,
        top: posY,
        left: posX,
        blend: 'over'
      },
      {
        input: rimOverlay,
        top: posY,
        left: posX,
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  return finalIcon;
}

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  const brandDir = path.join(publicDir, 'brand');

  console.log('Generating authentic Apple Liquid Glass icons with cleaned original logo...');

  // Generate 512x512 and 192x192 icons
  const icon512 = await generateAppleLiquidGlassIcon(512);
  const icon192 = await generateAppleLiquidGlassIcon(192);

  // Write Apple Touch Icons
  await sharp(icon512).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(icon512).toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('✅ Generated public/apple-touch-icon.png (512x512)');

  // Write PWA & brand launcher icons
  await sharp(icon192).toFile(path.join(brandDir, 'icon-192.png'));
  await sharp(icon512).toFile(path.join(brandDir, 'icon-512.png'));
  await sharp(icon512).toFile(path.join(brandDir, 'app-icon.png'));
  console.log('✅ Generated brand/icon-192.png, brand/icon-512.png, brand/app-icon.png');
}

run().catch(console.error);
