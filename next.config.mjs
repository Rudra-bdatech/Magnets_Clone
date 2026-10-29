/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses with gzip
  compress: true,

  // SWC minifier (default in Next 14, explicit for clarity)
  swcMinify: true,

  // Optimize images: allow WebP/AVIF conversion, local images allowed
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce JS bundle size (tree-shaking aware)
    optimizePackageImports: ["lucide-react", "lenis", "framer-motion"],
  },

  // Production compiler: remove console.log to reduce bundle size (keep errors/warnings for server logs)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Security + Caching Headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://js.stripe.com https://checkout.razorpay.com https://js.chargebee.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' data: blob: https: http:",
              "connect-src 'self' https: wss: data: blob:",
              "frame-src 'self' https://accounts.google.com https://js.stripe.com https://api.stripe.com https://checkout.razorpay.com https://*.chargebee.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
      {
        // File route: the dashboard previews PDFs in an iframe on the same origin
        source: "/r/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Landing page: allow bfcache (no no-store, no no-cache)
        // stale-while-revalidate keeps it fast AND fresh
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=60, stale-while-revalidate=3600" },
        ],
      },
      {
        // Static assets (fonts, images): immutable 1-year cache
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public images and fonts: long cache
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;