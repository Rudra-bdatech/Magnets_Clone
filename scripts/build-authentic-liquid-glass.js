const sharp = require('sharp');
const path = require('path');

const path1 = "M 88.539 1.112 C 67.269 4.211, 45.272 15.394, 29.940 30.903 C 21.022 39.924, 15.317 48.033, 9.967 59.294 C 4.121 71.599, 1.065 83.391, 0.759 94.831 L 0.500 104.500 196.500 104.791 C 326.942 104.984, 396.202 104.733, 403.567 104.039 C 409.654 103.466, 418.204 102.067, 422.567 100.931 C 432.582 98.322, 447.233 91.436, 455.852 85.288 C 475.477 71.286, 490.643 49.311, 496.447 26.464 C 498.184 19.625, 499.951 8.016, 499.980 3.250 L 500 0 297.250 0.122 C 185.738 0.189, 91.818 0.635, 88.539 1.112";
const path2 = "M 48.598 218.842 C 48.232 219.433, 57.546 242.999, 69.296 271.209 L 90.659 322.500 201.580 322.494 L 312.500 322.488 322.277 319.795 C 341.532 314.490, 359.712 303.635, 372.555 289.772 C 383.248 278.230, 392.209 262.514, 396.441 247.881 C 397.803 243.170, 401.274 219.872, 400.686 219.385 C 400.584 219.300, 321.472 218.901, 224.881 218.498 C 99.931 217.978, 49.071 218.077, 48.598 218.842";
const path3 = "M 138.994 437.750 C 138.991 438.163, 148.554 461.607, 160.244 489.848 L 181.500 541.197 190.500 540.632 C 206.811 539.608, 223.715 533.931, 237.790 524.752 C 246.967 518.767, 259.514 506.871, 265.595 498.390 C 271.337 490.381, 277.206 478.448, 280.295 468.500 C 282.854 460.257, 285.684 439.917, 284.532 438.051 C 284.087 437.332, 261.018 437, 211.441 437 C 171.598 437, 138.998 437.337, 138.994 437.750";

function generateCleanLiquidGlassSvg(size = 1024) {
  // Glyph height scale: ~58% for ideal Apple breathing room
  function generateLiquidGlassSvg({ size = 1024, mode = 'light', transparent = false } = {}) {
    const isDark = mode === 'dark';
    const scale = (size * 0.58) / 541.2;
    const glyphW = 500 * scale;
    const glyphH = 541.2 * scale;
    const tx = (size - glyphW) / 2;
    const ty = (size - glyphH) / 2;
    const rSquircle = size * 0.224;

    // Colors & Gradients based on mode
    const tileFill = isDark ? 'url(#tileDark)' : 'url(#tileLight)';
    const tileStroke = isDark ? 'url(#rimDark)' : 'url(#rimLight)';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <!-- Pristine Apple Ceramic Glass Tile -->
    <linearGradient id="tileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
    <!-- Light Mode Tile: Crisp Ceramic White Glass -->
    <linearGradient id="tileLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#FAFCFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>

    <!-- Apple Squircle Outer Rim Bevel -->
    <linearGradient id="tileRimHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
    <!-- Dark Mode Tile: Apple iOS 18 Obsidian Matte Glass -->
    <linearGradient id="tileDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1C1D24" />
      <stop offset="50%" stop-color="#121318" />
      <stop offset="100%" stop-color="#0B0C10" />
    </linearGradient>

    <!-- Tile Rim Highlight -->
    <linearGradient id="rimLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.5" />
    </linearGradient>

    <!-- Authentic Liquid Glass 3D Body Gradient (Smooth volumetric flow) -->
    <linearGradient id="liquid3D" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="22%" stop-color="#0EA5E9" />
      <stop offset="55%" stop-color="#0284C7" />
      <stop offset="85%" stop-color="#0066B2" />
      <stop offset="100%" stop-color="#004785" />
    <linearGradient id="rimDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
    </linearGradient>

    <!-- Smooth Directional Specular Sheen (Seamless overhead softbox reflection) -->
    <linearGradient id="liquidSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="70%" stop-color="#0284C7" stop-opacity="0" />
      <stop offset="100%" stop-color="#002D59" stop-opacity="0.25" />
    <!-- Liquid Body 3D Gradient (Light vs Dark Luminous) -->
    <linearGradient id="liquidGrad" x1="10%" y1="0%" x2="90%" y2="100%">
      ${isDark ? `
        <stop offset="0%" stop-color="#67E8F9" />
        <stop offset="20%" stop-color="#38BDF8" />
        <stop offset="55%" stop-color="#0EA5E9" />
        <stop offset="85%" stop-color="#0284C7" />
        <stop offset="100%" stop-color="#0369A1" />
      ` : `
        <stop offset="0%" stop-color="#38BDF8" />
        <stop offset="22%" stop-color="#0EA5E9" />
        <stop offset="55%" stop-color="#0284C7" />
        <stop offset="85%" stop-color="#0066B2" />
        <stop offset="100%" stop-color="#004785" />
      `}
    </linearGradient>

    <!-- Subtle Optical Rim Light (Glass lens edge) -->
    <!-- Specular Directional Sheen -->
    <linearGradient id="specularSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      ${isDark ? `
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75" />
        <stop offset="35%" stop-color="#BAE6FD" stop-opacity="0.25" />
        <stop offset="70%" stop-color="#0284C7" stop-opacity="0" />
        <stop offset="100%" stop-color="#082F49" stop-opacity="0.3" />
      ` : `
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
        <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.15" />
        <stop offset="70%" stop-color="#0284C7" stop-opacity="0" />
        <stop offset="100%" stop-color="#002D59" stop-opacity="0.25" />
      `}
    </linearGradient>

    <!-- Optical Glass Edge Rim Stroke -->
    <linearGradient id="glassRim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#BAE6FD" stop-opacity="0.4" />
      <stop offset="80%" stop-color="#0284C7" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#003B73" stop-opacity="0.5" />
      ${isDark ? `
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
        <stop offset="40%" stop-color="#67E8F9" stop-opacity="0.7" />
        <stop offset="80%" stop-color="#0284C7" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#082F49" stop-opacity="0.7" />
      ` : `
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
        <stop offset="40%" stop-color="#BAE6FD" stop-opacity="0.4" />
        <stop offset="80%" stop-color="#0284C7" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#003B73" stop-opacity="0.5" />
      `}
    </linearGradient>

    <!-- Natural Soft Contact Shadow under 3D Funnel -->
    <filter id="naturalDepthShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="${(size * 0.022).toFixed(1)}" stdDeviation="${(size * 0.018).toFixed(1)}" flood-color="#003566" flood-opacity="0.25" />
      <feDropShadow dx="0" dy="${(size * 0.006).toFixed(1)}" stdDeviation="${(size * 0.006).toFixed(1)}" flood-color="#0066B2" flood-opacity="0.18" />
    <!-- Caustic Ambient Shadow / Glow -->
    <filter id="shadowFilter" x="-30%" y="-30%" width="160%" height="160%">
      ${isDark ? `
        <!-- Electric Sapphire Caustic Bloom on Dark Obsidian Tile -->
        <feDropShadow dx="0" dy="${(size * 0.015).toFixed(1)}" stdDeviation="${(size * 0.025).toFixed(1)}" flood-color="#0284C7" flood-opacity="0.45" />
        <feDropShadow dx="0" dy="${(size * 0.005).toFixed(1)}" stdDeviation="${(size * 0.012).toFixed(1)}" flood-color="#38BDF8" flood-opacity="0.35" />
      ` : `
        <!-- Soft Daytime Blue Depth Shadow on White Tile -->
        <feDropShadow dx="0" dy="${(size * 0.022).toFixed(1)}" stdDeviation="${(size * 0.018).toFixed(1)}" flood-color="#003566" flood-opacity="0.25" />
        <feDropShadow dx="0" dy="${(size * 0.006).toFixed(1)}" stdDeviation="${(size * 0.006).toFixed(1)}" flood-color="#0066B2" flood-opacity="0.18" />
      `}
    </filter>
  </defs>

  ${!transparent ? `
  <!-- Squircle Base Tile -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rSquircle}" ry="${rSquircle}" fill="url(#tileGradient)" />
  <rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="${rSquircle - 1.5}" ry="${rSquircle - 1.5}" fill="none" stroke="url(#tileRimHighlight)" stroke-width="${Math.max(2, size * 0.003)}" />
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rSquircle}" ry="${rSquircle}" fill="${tileFill}" />
  <rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="${rSquircle - 1.5}" ry="${rSquircle - 1.5}" fill="none" stroke="${tileStroke}" stroke-width="${Math.max(2, size * 0.003)}" />
  ` : ''}

  <!-- 100% Vector Exact Funnel Glyphs with Unified Liquid Glass Shading -->
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" filter="url(#naturalDepthShadow)">
    
  <!-- 100% Vector Exact Funnel Glyphs with Liquid Glass Shading -->
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" filter="url(#shadowFilter)">
    <!-- Path 1: Top Bar -->
    <g>
      <path d="${path1}" fill="url(#liquid3D)" />
      <path d="${path1}" fill="url(#liquidSheen)" />
      <path d="${path1}" fill="url(#liquidGrad)" />
      <path d="${path1}" fill="url(#specularSheen)" />
      <path d="${path1}" fill="none" stroke="url(#glassRim)" stroke-width="2.5" />
    </g>

    <!-- Path 2: Middle Segment -->
    <g>
      <path d="${path2}" fill="url(#liquid3D)" />
      <path d="${path2}" fill="url(#liquidSheen)" />
      <path d="${path2}" fill="url(#liquidGrad)" />
      <path d="${path2}" fill="url(#specularSheen)" />
      <path d="${path2}" fill="none" stroke="url(#glassRim)" stroke-width="2.5" />
    </g>

    <!-- Path 3: Bottom Spout -->
    <g>
      <path d="${path3}" fill="url(#liquid3D)" />
      <path d="${path3}" fill="url(#liquidSheen)" />
      <path d="${path3}" fill="url(#liquidGrad)" />
      <path d="${path3}" fill="url(#specularSheen)" />
      <path d="${path3}" fill="none" stroke="url(#glassRim)" stroke-width="2.5" />
    </g>

  </g>
</svg>`;
  }

  async function render() {
    async function renderAll() {
      const publicDir = path.join(__dirname, '..', 'public');
      const brandDir = path.join(publicDir, 'brand');
      const brainDir = 'C:/Users/Rudranath Kabiraj/.gemini/antigravity/brain/f4acc3e3-58ed-40a1-9b10-ff9844c2316a';

      const svg1024 = generateCleanLiquidGlassSvg(1024);
      const svg512 = generateCleanLiquidGlassSvg(512);
      // 1. Light Mode App Icon (Tile)
      const svgLight1024 = generateLiquidGlassSvg({ size: 1024, mode: 'light', transparent: false });
      const svgLight512 = generateLiquidGlassSvg({ size: 512, mode: 'light', transparent: false });
      await sharp(Buffer.from(svgLight1024)).png().toFile(path.join(brandDir, 'app-icon-light-1024.png'));
      await sharp(Buffer.from(svgLight512)).png().toFile(path.join(brandDir, 'app-icon-light.png'));
      await sharp(Buffer.from(svgLight1024)).png().toFile(path.join(brainDir, 'funnels-liquid-glass-light.png'));

      const out1024 = path.join(brandDir, 'funnels-exact-liquid-glass-1024.png');
      const out512 = path.join(brandDir, 'funnels-exact-liquid-glass.png');
      const artifactPath = 'C:/Users/Rudranath Kabiraj/.gemini/antigravity/brain/f4acc3e3-58ed-40a1-9b10-ff9844c2316a/funnels-exact-liquid-glass.png';
      // Default app-icon.png and apple-touch-icon.png use Light Mode (Apple HIG default)
      await sharp(Buffer.from(svgLight512)).png().toFile(path.join(brandDir, 'app-icon.png'));
      await sharp(Buffer.from(svgLight512)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
      await sharp(Buffer.from(svgLight512)).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));

      await sharp(Buffer.from(svg1024)).png().toFile(out1024);
      await sharp(Buffer.from(svg512)).png().toFile(out512);
      await sharp(Buffer.from(svg1024)).png().toFile(artifactPath);
      // 2. Dark Mode App Icon (Apple iOS 18 Obsidian Tile with Electric Sapphire Caustics)
      const svgDark1024 = generateLiquidGlassSvg({ size: 1024, mode: 'dark', transparent: false });
      const svgDark512 = generateLiquidGlassSvg({ size: 512, mode: 'dark', transparent: false });
      await sharp(Buffer.from(svgDark1024)).png().toFile(path.join(brandDir, 'app-icon-dark-1024.png'));
      await sharp(Buffer.from(svgDark512)).png().toFile(path.join(brandDir, 'app-icon-dark.png'));
      await sharp(Buffer.from(svgDark1024)).png().toFile(path.join(brainDir, 'funnels-liquid-glass-dark.png'));

      // Update app-icon.png and apple-touch-icon.png
      await sharp(Buffer.from(svg512)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
      await sharp(Buffer.from(svg512)).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
      await sharp(Buffer.from(svg512)).png().toFile(path.join(brandDir, 'app-icon.png'));
      // 3. Transparent Marks for in-app headers (Light Mode & Dark Mode)
      const markLightSvg = generateLiquidGlassSvg({ size: 512, mode: 'light', transparent: true });
      const markDarkSvg = generateLiquidGlassSvg({ size: 512, mode: 'dark', transparent: true });

      console.log('Successfully generated clean, authentic Liquid Glass on exact vector paths!');
      await sharp(Buffer.from(markLightSvg)).png().toFile(path.join(brandDir, 'funnels-mark-light.png'));
      await sharp(Buffer.from(markLightSvg)).webp().toFile(path.join(brandDir, 'funnels-mark-light.webp'));

      await sharp(Buffer.from(markDarkSvg)).png().toFile(path.join(brandDir, 'funnels-mark-dark.png'));
      await sharp(Buffer.from(markDarkSvg)).webp().toFile(path.join(brandDir, 'funnels-mark-dark.webp'));

      console.log('Successfully generated full Light & Dark mode Liquid Glass icon suites!');
    }

    render().catch(console.error);
    renderAll().catch(console.error);
