const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Funnel Vector Mark
const funnelPaths = `
  <defs>
    <linearGradient id="lightBlueGrad" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0066B2" />
    </linearGradient>
  </defs>
  <path d="M 88.539 1.112 C 67.269 4.211, 45.272 15.394, 29.940 30.903 C 21.022 39.924, 15.317 48.033, 9.967 59.294 C 4.121 71.599, 1.065 83.391, 0.759 94.831 L 0.500 104.500 196.500 104.791 C 326.942 104.984, 396.202 104.733, 403.567 104.039 C 409.654 103.466, 418.204 102.067, 422.567 100.931 C 432.582 98.322, 447.233 91.436, 455.852 85.288 C 475.477 71.286, 490.643 49.311, 496.447 26.464 C 498.184 19.625, 499.951 8.016, 499.980 3.250 L 500 0 297.250 0.122 C 185.738 0.189, 91.818 0.635, 88.539 1.112" fill="url(#lightBlueGrad)" />
  <path d="M 48.598 218.842 C 48.232 219.433, 57.546 242.999, 69.296 271.209 L 90.659 322.500 201.580 322.494 L 312.500 322.488 322.277 319.795 C 341.532 314.490, 359.712 303.635, 372.555 289.772 C 383.248 278.230, 392.209 262.514, 396.441 247.881 C 397.803 243.170, 401.274 219.872, 400.686 219.385 C 400.584 219.300, 321.472 218.901, 224.881 218.498 C 99.931 217.978, 49.071 218.077, 48.598 218.842" fill="url(#lightBlueGrad)" />
  <path d="M 138.994 437.750 C 138.991 438.163, 148.554 461.607, 160.244 489.848 L 181.500 541.197 190.500 540.632 C 206.811 539.608, 223.715 533.931, 237.790 524.752 C 246.967 518.767, 259.514 506.871, 265.595 498.390 C 271.337 490.381, 277.206 478.448, 280.295 468.500 C 282.854 460.257, 285.684 439.917, 284.532 438.051 C 284.087 437.332, 261.018 437, 211.441 437 C 171.598 437, 138.998 437.337, 138.994 437.750" fill="url(#lightBlueGrad)" />
`;

function createSvg({ size = 512, scale = 0.58, bg = '#ffffff' } = {}) {
  // Original funnel path bounds: width ~500, height ~541.2
  const glyphW = 500 * scale;
  const glyphH = 541.2 * scale;
  const tx = (size - glyphW) / 2;
  const ty = (size - glyphH) / 2;

  const bgRect = bg && bg !== 'none' ? `<rect width="${size}" height="${size}" fill="${bg}" />` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bgRect}
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${funnelPaths}
  </g>
</svg>`;
}

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  const brandDir = path.join(publicDir, 'brand');

  // 1. Apple Touch Icon (180x180 & 512x512) with solid white background and 58% glyph scale (21% safe-margin)
  const appleTouchSvg512 = createSvg({ size: 512, scale: 0.58, bg: '#ffffff' });
  const appleTouchSvg180 = createSvg({ size: 180, scale: 0.58, bg: '#ffffff' });
  const appleTouchSvg192 = createSvg({ size: 192, scale: 0.58, bg: '#ffffff' });

  // Generate public/apple-touch-icon.png (512x512)
  await sharp(Buffer.from(appleTouchSvg512)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png (512x512)');

  // Generate public/apple-touch-icon-precomposed.png
  await sharp(Buffer.from(appleTouchSvg512)).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('Created public/apple-touch-icon-precomposed.png');

  // Generate PWA manifest icons
  await sharp(Buffer.from(appleTouchSvg192)).png().toFile(path.join(brandDir, 'icon-192.png'));
  await sharp(Buffer.from(appleTouchSvg512)).png().toFile(path.join(brandDir, 'icon-512.png'));
  console.log('Created brand/icon-192.png & brand/icon-512.png');

  // Also update public/brand/funnels-mark-light.png with proper safe margins
  // Keep background transparent for funnels-mark-light, but give it 68% glyph scale (~16% padding all around)
  // so it never bleeds or clips even if used unpadded!
  const markTransparentSvg = createSvg({ size: 512, scale: 0.64, bg: 'none' });
  await sharp(Buffer.from(markTransparentSvg)).png().toFile(path.join(brandDir, 'funnels-mark-light.png'));
  await sharp(Buffer.from(markTransparentSvg)).webp().toFile(path.join(brandDir, 'funnels-mark-light.webp'));
  console.log('Updated public/brand/funnels-mark-light.png & .webp with safe-area padding');

  // Also create an app-icon-white.png in brand for BDA Ecosystem & other launchers
  await sharp(Buffer.from(appleTouchSvg512)).png().toFile(path.join(brandDir, 'app-icon.png'));
  console.log('Created public/brand/app-icon.png');
}

run().catch(console.error);
