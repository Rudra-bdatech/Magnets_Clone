const sharp = require('sharp');
const potrace = require('potrace');
const fs = require('fs');

async function generatePerfectSvg() {
  const { data, info } = await sharp('public/brand/custom-logo-light.png')
    .trim()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log('Source image dimensions:', width, 'x', height);

  const traceMask = (filterFn) => {
    return new Promise((resolve, reject) => {
      const mask = Buffer.alloc(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels;
          const a = data[idx + 3];
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          if (a > 60 && filterFn(x, y, r, g, b)) {
            mask[y * width + x] = 0; // black = foreground
          } else {
            mask[y * width + x] = 255; // white = background
          }
        }
      }

      sharp(mask, { raw: { width, height, channels: 1 } })
        .png()
        .toBuffer()
        .then(bmp => {
          potrace.trace(bmp, {
            threshold: 128,
            optCurve: true,
            optTolerance: 0.1,
            turdSize: 1,
            turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY
          }, (err, svg) => {
            if (err) return reject(err);
            const match = svg.match(/d="([^"]+)"/);
            resolve(match ? match[1] : '');
          });
        })
        .catch(reject);
    });
  };

  const isBlue = (r, g, b) => b > r + 30 && b > g;

  console.log('Tracing Top Bar of F...');
  const pathTopBar = await traceMask((x, y, r, g, b) => isBlue(r, g, b) && x < 650 && y < 150);

  console.log('Tracing Mid Bar of F...');
  const pathMidBar = await traceMask((x, y, r, g, b) => isBlue(r, g, b) && x < 650 && y >= 150 && y < 350);

  console.log('Tracing Bot Bar of F (including tip)...');
  const pathBotBar = await traceMask((x, y, r, g, b) => x < 400 && y >= 350 && (isBlue(r, g, b) || r < 30));

  console.log('Tracing Letters (unnels + TM) with fill-rule="evenodd"...');
  const pathLetters = await traceMask((x, y, r, g, b) => x >= 400 && r < 50 && g < 50 && b < 50);

  const dotCx = 2451;
  const dotCy = 497.5;
  const dotR = 43;

  // Dark Mode SVG (silver metallic gradient, identical to Google Drive asset)
  const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" fill="none" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- Metallic gradient for top bar -->
    <linearGradient id="topBarGrad" x1="0" y1="0" x2="0" y2="105" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#EFEFEF" />
      <stop offset="60%" stop-color="#C5C5C5" />
      <stop offset="100%" stop-color="#9C9C9C" />
    </linearGradient>

    <!-- Metallic gradient for mid bar -->
    <linearGradient id="midBarGrad" x1="0" y1="210" x2="0" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#EFEFEF" />
      <stop offset="60%" stop-color="#C5C5C5" />
      <stop offset="100%" stop-color="#9C9C9C" />
    </linearGradient>

    <!-- Metallic gradient for bot bar -->
    <linearGradient id="botBarGrad" x1="0" y1="420" x2="0" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#EFEFEF" />
      <stop offset="60%" stop-color="#C5C5C5" />
      <stop offset="100%" stop-color="#9C9C9C" />
    </linearGradient>

    <!-- Metallic gradient for letters: unnels + TM -->
    <linearGradient id="lettersGrad" x1="0" y1="100" x2="0" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#F2F2F2" />
      <stop offset="55%" stop-color="#C8C8C8" />
      <stop offset="100%" stop-color="#969696" />
    </linearGradient>
  </defs>

  <!-- Funnel Mark (F) Top Bar -->
  <path d="${pathTopBar}" fill="url(#topBarGrad)" />

  <!-- Funnel Mark (F) Mid Bar -->
  <path d="${pathMidBar}" fill="url(#midBarGrad)" />

  <!-- Funnel Mark (F) Bot Bar -->
  <path d="${pathBotBar}" fill="url(#botBarGrad)" />

  <!-- Letters: unnels + TM (with fill-rule="evenodd" for letter 'e' eye) -->
  <path d="${pathLetters}" fill="url(#lettersGrad)" fill-rule="evenodd" />

  <!-- Funnels Accent Blue Dot -->
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#0066B2" />
</svg>`;

  // Light Mode SVG
  const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" fill="none" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="lightBlueGrad" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0066B2" />
    </linearGradient>
    <linearGradient id="lightTextGrad" x1="0" y1="100" x2="0" y2="540" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#18181B" />
      <stop offset="100%" stop-color="#09090B" />
    </linearGradient>
  </defs>

  <!-- Funnel Mark (F) in Vibrant Blue -->
  <path d="${pathTopBar}" fill="url(#lightBlueGrad)" />
  <path d="${pathMidBar}" fill="url(#lightBlueGrad)" />
  <path d="${pathBotBar}" fill="url(#lightBlueGrad)" />

  <!-- Letters: unnels + TM in Crisp Charcoal (with fill-rule="evenodd" for letter 'e' eye) -->
  <path d="${pathLetters}" fill="url(#lightTextGrad)" fill-rule="evenodd" />

  <!-- Funnels Accent Blue Dot -->
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#0066B2" />
</svg>`;

  fs.writeFileSync('public/brand/funnels-footer-dark.svg', darkSvg);
  fs.writeFileSync('public/brand/funnels-footer-light.svg', lightSvg);
  fs.writeFileSync('C:/Users/Rudranath Kabiraj/.gemini/antigravity/brain/c3e95309-f640-40e7-ba14-7f94946cd75b/funnels-footer-dark.svg', darkSvg);
  fs.writeFileSync('C:/Users/Rudranath Kabiraj/.gemini/antigravity/brain/c3e95309-f640-40e7-ba14-7f94946cd75b/funnels-footer-light.svg', lightSvg);

  console.log('Saved both vector SVGs successfully with complete letters and evenodd rule!');
}

generatePerfectSvg().catch(console.error);
