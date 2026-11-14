const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Exact Official Funnels Blue Mark Gradient from public/brand/funnels-footer-light.svg
const exactBrandBlueFunnelPaths = `
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

/**
 * Creates SVG icon markup with optical centering and consistent proportional scaling across all resolutions
 */
function createSvg({ size = 512, targetRatio = 0.66, bg = '#ffffff' } = {}) {
  // Glyph native bounds: width = 500, height = 541.2
  const scale = (size * targetRatio) / 541.2;
  const glyphW = 500 * scale;
  const glyphH = 541.2 * scale;
  const tx = (size - glyphW) / 2;
  // Optical vertical centering: shift ~1.6% downwards to balance heavy top bar with tapered point
  const ty = (size - glyphH) / 2 + (size * 0.016);

  const bgRect = bg && bg !== 'none' ? `<rect width="${size}" height="${size}" fill="${bg}" />` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bgRect}
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(5)})">
    ${exactBrandBlueFunnelPaths}
  </g>
</svg>`;
}

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  const brandDir = path.join(publicDir, 'brand');

  const TARGET_RATIO = 0.66; // 66% canvas height occupancy: Apple HIG optimal keyline scale (not small!)
  const BG_LIGHT = '#ffffff'; // Clean solid white background for Light Mode

  // 1. Primary Apple Touch Icons with Exact Funnels Blue on White (#ffffff)
  const lightIconSvg512 = createSvg({ size: 512, targetRatio: TARGET_RATIO, bg: BG_LIGHT });

  // Generate public/apple-touch-icon.png (Used by iPhone Home Screen)
  await sharp(Buffer.from(lightIconSvg512)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(lightIconSvg512)).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('✅ Generated public/apple-touch-icon.png with Exact Brand Blue on White (#ffffff)');

  // Generate PWA manifest icons (Light theme)
  const icon192Svg = createSvg({ size: 192, targetRatio: TARGET_RATIO, bg: BG_LIGHT });
  await sharp(Buffer.from(icon192Svg)).png().toFile(path.join(brandDir, 'icon-192.png'));
  await sharp(Buffer.from(lightIconSvg512)).png().toFile(path.join(brandDir, 'icon-512.png'));
  await sharp(Buffer.from(lightIconSvg512)).png().toFile(path.join(brandDir, 'app-icon.png'));
  console.log('✅ Generated brand/icon-192.png, brand/icon-512.png, brand/app-icon.png');

  // Also update transparent brand marks with matching scale & safe area
  const markTransparentSvg = createSvg({ size: 512, targetRatio: TARGET_RATIO, bg: 'none' });
  await sharp(Buffer.from(markTransparentSvg)).png().toFile(path.join(brandDir, 'funnels-mark-light.png'));
  await sharp(Buffer.from(markTransparentSvg)).webp().toFile(path.join(brandDir, 'funnels-mark-light.webp'));
  console.log('✅ Generated public/brand/funnels-mark-light (.png and .webp)');
}

run().catch(console.error);
