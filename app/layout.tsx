import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import dynamic from "next/dynamic";
import "./globals.css";
import "@/src/shaders/threeui.css";

const SmoothScroll = dynamic(() => import("@/components/smooth-scroll"), { ssr: false });

const geist = localFont({
  src: "../public/fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
  preload: true,
});

const geistMono = localFont({
  src: "../public/fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

const SITE = "https://magnets.bdatech.in";

export const metadata: Metadata = {
  title: {
    default: "Lead Magnet Builder for Landing Pages and Email Capture",
    template: "%s. LeadMagnets",
  },
  description:
    "Create lead magnet landing pages, capture emails, deliver resources instantly, and follow up automatically. Publish on LeadMagnets or your own domain.",
  applicationName: "LeadMagnets",
  authors: [{ name: "LeadMagnets", url: SITE }],
  creator: "LeadMagnets",
  publisher: "LeadMagnets",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  formatDetection: { telephone: false, address: false, email: false },
  manifest: "/manifest.json",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "LeadMagnets",
    locale: "en_US",
    url: SITE,
    title: "LeadMagnets | Lead Magnet Builder",
    description:
      "Create a lead magnet page, capture emails, deliver the resource, and follow up from one place.",
    images: [{ url: "/landing-dashboard.png", width: 1280, height: 720, alt: "LeadMagnets lead magnet builder dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadMagnets | Lead Magnet Builder",
    description:
      "Create a lead magnet page, capture emails, deliver the resource, and follow up from one place.",
    images: ["/landing-dashboard.png"],
  },
  icons: {
    icon: "/brand/gemini-logo-dark.webp",
    apple: "/brand/gemini-logo-dark.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
  ],
  colorScheme: "light dark",
};

const themeScript = `
  try {
    var saved = localStorage.getItem('leadmagnets-theme');
    var theme = saved === 'light' || saved === 'dark'
      ? saved
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;


import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Preload brand logos above the fold for faster LCP */}
        <link rel="preload" as="image" href="/brand/custom-logo-light.webp" type="image/webp" />
        <link rel="preload" as="image" href="/brand/custom-logo.webp" type="image/webp" />
        {/* Resource hints: preconnect to same-origin CDN for /_next/static chunks */}
        <link rel="preconnect" href="https://magnets.bdatech.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://magnets.bdatech.in" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        <NextTopLoader
          color="#0066B2"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2.5}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow={false}
          zIndex={99999}
        />
        <SmoothScroll />
        <div className="contents app-theme">{children}</div>
      </body>
    </html>
  );
}