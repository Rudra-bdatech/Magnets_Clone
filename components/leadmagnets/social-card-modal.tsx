"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Share2,
  Layers,
  Upload,
  Loader2,
  CheckCircle2,
  Sliders,
  Type,
  ExternalLink,
  Smartphone,
  Globe,
  Palette
} from "lucide-react";
import Button from "@/components/ui/button";
import { type MagnetPage, type Account } from "@/lib/data";

interface SocialCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: MagnetPage;
  account: Account | null;
  onSaveAsCover?: (imageUrl: string) => void;
}

const BADGE_PRESETS = [
  "🎁 FREE RESOURCE",
  "🔥 NEW GUIDE",
  "⚡ CHEAT SHEET",
  "📊 FREE TEMPLATE",
  "🚀 STEP-BY-STEP",
  "🎯 ACTION PLAN",
];

const TYPOGRAPHY_PRESETS = [
  { id: "sans", label: "Modern Sans", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: "serif", label: "Editorial Serif", fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif" },
  { id: "mono", label: "Tech Mono", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
];

export default function SocialCardModal({
  isOpen,
  onClose,
  page,
  account,
  onSaveAsCover,
}: SocialCardModalProps) {
  // Theme & Preset States
  const [theme, setTheme] = useState<"gradient" | "sunset" | "emerald" | "neon" | "dark" | "minimal" | "custom">("gradient");
  const [colorStart, setColorStart] = useState("#0066B2");
  const [colorEnd, setColorEnd] = useState("#7C3AED");
  const [format, setFormat] = useState<"linkedin" | "twitter" | "story" | "facebook">("linkedin");
  const [resolution, setResolution] = useState<"1x" | "2x">("1x");
  const [fontFamily, setFontFamily] = useState(TYPOGRAPHY_PRESETS[0].id);

  // Content Customization Overrides (defaults to page content)
  const [cardHeadline, setCardHeadline] = useState(page.headline || page.name || "Free Resource");
  const [cardSubheadline, setCardSubheadline] = useState(page.subheadline || "");
  const [badgeText, setBadgeText] = useState(BADGE_PRESETS[0]);
  const [isCustomBadge, setIsCustomBadge] = useState(false);

  // Layer Toggles
  const [showAvatar, setShowAvatar] = useState(true);
  const [showCoverImage, setShowCoverImage] = useState(Boolean(page.imageUrl));
  const [showBullets, setShowBullets] = useState(true);
  const [showUrlPill, setShowUrlPill] = useState(true);

  // Action & Feedback States
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isSavingOG, setIsSavingOG] = useState(false);
  const [saveOGSuccess, setSaveOGSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"styles" | "content" | "layers">("styles");

  const cardRef = useRef<HTMLDivElement>(null);

  // Reset/Sync local states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCardHeadline(page.headline || page.name || "Free Resource");
      setCardSubheadline(page.subheadline || "");
      setShowCoverImage(Boolean(page.imageUrl));
      setSaveOGSuccess(false);
    }
  }, [isOpen, page.headline, page.name, page.subheadline, page.imageUrl]);

  if (!isOpen) return null;

  const creatorName = account?.name || "Creator";
  const username = account?.username || "alexrivera";
  const avatarUrl = account?.avatar || account?.avatar_url || "";
  const coverImageUrl = page.imageUrl || "";

  // Public Lead Magnet URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://magnets.bdatech.in";
  const displayUrl = `${origin}/${username}/${page.slug || page.id}`;
  const cleanUrlDisplay = displayUrl.replace(/^https?:\/\//, "");

  // Active Font
  const selectedFont = TYPOGRAPHY_PRESETS.find((f) => f.id === fontFamily)?.fontFamily || TYPOGRAPHY_PRESETS[0].fontFamily;
  const isLandscape = format === "twitter" || format === "facebook";

  // Render Canvas into an HTMLCanvasElement
  async function renderCardCanvas(scaleMultiplier: number = 1): Promise<HTMLCanvasElement> {
    const isLandscape = format === "twitter" || format === "facebook";
    const baseWidth = format === "story" ? 1080 : 1200;
    const baseHeight = format === "story" ? 1920 : format === "linkedin" ? 1200 : 675;

    const width = baseWidth * scaleMultiplier;
    const height = baseHeight * scaleMultiplier;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    const scale = scaleMultiplier;

    // Background Styling
    if (theme === "dark") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "minimal") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 14 * scale;
      ctx.strokeRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (theme === "gradient") {
        grad.addColorStop(0, "#0066B2");
        grad.addColorStop(0.5, "#7C3AED");
        grad.addColorStop(1, "#4F46E5");
      } else if (theme === "sunset") {
        grad.addColorStop(0, "#F43F5E");
        grad.addColorStop(1, "#F59E0B");
      } else if (theme === "emerald") {
        grad.addColorStop(0, "#0D9488");
        grad.addColorStop(1, "#059669");
      } else if (theme === "neon") {
        grad.addColorStop(0, "#4338CA");
        grad.addColorStop(1, "#DB2777");
      } else if (theme === "custom") {
        grad.addColorStop(0, colorStart);
        grad.addColorStop(1, colorEnd);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    const paddingX = (format === "story" ? 90 : 80) * scale;
    const maxTextWidth = width - paddingX * 2;

    // Badge Pill
    const badgeY = (format === "story" ? 160 : isLandscape ? 60 : 100) * scale;
    const badgeFontSize = (isLandscape ? 18 : 22) * scale;

    ctx.font = `bold ${badgeFontSize}px ${selectedFont}`;
    const badgeMeasure = ctx.measureText(badgeText);
    const badgePillWidth = badgeMeasure.width + 36 * scale;
    const badgePillHeight = badgeFontSize + 18 * scale;

    ctx.fillStyle = theme === "minimal" ? "rgba(0, 102, 178, 0.12)" : "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.roundRect(paddingX, badgeY - badgePillHeight + 8 * scale, badgePillWidth, badgePillHeight, 9999 * scale);
    ctx.fill();

    ctx.fillStyle = theme === "minimal" ? "#0066B2" : "#FFFFFF";
    ctx.fillText(badgeText, paddingX + 18 * scale, badgeY);

    // Headline (Multi-line text wrapping)
    const fontSize = (format === "story" ? 64 : format === "linkedin" ? 48 : 34) * scale;
    ctx.font = `800 ${fontSize}px ${selectedFont}`;
    ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";

    const words = cardHeadline.split(" ");
    let line = "";
    let y = badgeY + fontSize + (isLandscape ? 20 : 32) * scale;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && i > 0) {
        ctx.fillText(line, paddingX, y);
        line = words[i] + " ";
        y += fontSize * 1.22;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, paddingX, y);

    // Subheadline
    if (cardSubheadline) {
      y += (isLandscape ? 18 : 26) * scale;
      const subFontSize = (format === "story" ? 30 : isLandscape ? 20 : 26) * scale;
      ctx.font = `500 ${subFontSize}px ${selectedFont}`;
      ctx.fillStyle = theme === "minimal" ? "#475569" : "rgba(255, 255, 255, 0.88)";
      const subWords = cardSubheadline.split(" ");
      let subLine = "";
      for (let i = 0; i < subWords.length; i++) {
        const testLine = subLine + subWords[i] + " ";
        if (ctx.measureText(testLine).width > maxTextWidth && i > 0) {
          ctx.fillText(subLine, paddingX, y);
          subLine = subWords[i] + " ";
          y += subFontSize * 1.28;
        } else {
          subLine = testLine;
        }
      }
      ctx.fillText(subLine, paddingX, y);
    }

    // Visual Mockup / Bullets Content Box
    if (showBullets) {
      const bulletItems = page.bullets && page.bullets.length > 0
        ? page.bullets.slice(0, 3)
        : [
          "100% actionable framework built for immediate results",
          "Includes pre-built copy-paste templates and workflow checklists",
          "Zero fluff: implementation ready step-by-step process",
        ];

      const bulletFontSize = (format === "story" ? 26 : isLandscape ? 17 : 22) * scale;
      ctx.font = `bold ${bulletFontSize}px ${selectedFont}`;
      const bulletLineHeight = bulletFontSize * 1.35;
      const bulletTextWidth = maxTextWidth - 80 * scale;
      const bulletItemGap = (isLandscape ? 8 : 16) * scale;
      const boxPaddingTopBottom = (isLandscape ? 20 : 34) * scale;

      let calculatedBulletsHeight = boxPaddingTopBottom;
      bulletItems.forEach((bText) => {
        const bWords = bText.split(" ");
        let bLine = "";
        let linesCount = 1;
        for (let i = 0; i < bWords.length; i++) {
          const testLine = bLine + bWords[i] + " ";
          if (ctx.measureText(testLine).width > bulletTextWidth && i > 0) {
            linesCount++;
            bLine = bWords[i] + " ";
          } else {
            bLine = testLine;
          }
        }
        calculatedBulletsHeight += linesCount * bulletLineHeight + bulletItemGap;
      });

      const cardBoxY = y + (isLandscape ? 18 : 36) * scale;
      const cardBoxHeight = calculatedBulletsHeight;

      // Draw Translucent Glass Container Box
      ctx.fillStyle = theme === "minimal" ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.roundRect(paddingX, cardBoxY, maxTextWidth, cardBoxHeight, (isLandscape ? 14 : 20) * scale);
      ctx.fill();

      ctx.strokeStyle = theme === "minimal" ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Render Bullets with Checkmarks
      let bulletY = cardBoxY + (isLandscape ? 22 : 36) * scale;
      const checkX = paddingX + (isLandscape ? 18 : 26) * scale;
      const textX = checkX + (isLandscape ? 28 : 38) * scale;

      bulletItems.forEach((bText) => {
        ctx.fillStyle = "#34D399";
        ctx.font = `bold ${bulletFontSize + 2 * scale}px ${selectedFont}`;
        ctx.fillText("✓", checkX, bulletY);

        ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";
        ctx.font = `bold ${bulletFontSize}px ${selectedFont}`;

        const bWords = bText.split(" ");
        let bLine = "";
        let lineY = bulletY;

        for (let i = 0; i < bWords.length; i++) {
          const testLine = bLine + bWords[i] + " ";
          if (ctx.measureText(testLine).width > bulletTextWidth && i > 0) {
            ctx.fillText(bLine, textX, lineY);
            bLine = bWords[i] + " ";
            lineY += bulletLineHeight;
          } else {
            bLine = testLine;
          }
        }
        ctx.fillText(bLine, textX, lineY);
        bulletY = lineY + bulletLineHeight + (isLandscape ? 8 : 14) * scale;
      });
    }

    // Footer divider line
    const footerY = height - (isLandscape ? 95 : 150) * scale;
    ctx.strokeStyle = theme === "minimal" ? "#E2E8F0" : "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(paddingX, footerY);
    ctx.lineTo(width - paddingX, footerY);
    ctx.stroke();

    // Author & Username Branding
    if (showAvatar) {
      ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";
      ctx.font = `bold ${(isLandscape ? 22 : 30) * scale}px ${selectedFont}`;
      ctx.fillText(`By ${creatorName}`, paddingX, height - (isLandscape ? 52 : 88) * scale);

      ctx.font = `500 ${(isLandscape ? 16 : 22) * scale}px ${selectedFont}`;
      ctx.fillStyle = theme === "minimal" ? "#64748B" : "rgba(255, 255, 255, 0.75)";
      ctx.fillText(`@${username}`, paddingX, height - (isLandscape ? 28 : 56) * scale);
    }

    // URL Pill
    if (showUrlPill) {
      const pillFontSize = (isLandscape ? 18 : 24) * scale;
      ctx.font = `bold ${pillFontSize}px ${selectedFont}`;
      const textWidth = ctx.measureText(cleanUrlDisplay).width;
      const pillWidth = textWidth + (isLandscape ? 30 : 40) * scale;
      const pillHeight = (isLandscape ? 40 : 52) * scale;
      const pillX = width - pillWidth - paddingX;
      const pillY = height - (isLandscape ? 68 : 98) * scale;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, (isLandscape ? 10 : 14) * scale);
      ctx.fill();

      ctx.fillStyle = "#0066B2";
      ctx.fillText(cleanUrlDisplay, pillX + (isLandscape ? 15 : 20) * scale, pillY + (isLandscape ? 26 : 34) * scale);
    }

    return canvas;
  }

  // 1. Download Card PNG (1x or 2x high-res)
  async function handleDownload() {
    try {
      const scaleMultiplier = resolution === "2x" ? 2 : 1;
      const canvas = await renderCardCanvas(scaleMultiplier);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${page.slug || "lead-magnet"}-social-card-${format}-${resolution}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download card error:", err);
    }
  }

  // 2. Direct Clipboard Image Copy (Ctrl+V / Cmd+V anywhere)
  async function handleCopyImage() {
    try {
      const canvas = await renderCardCanvas(1);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard && (window as any).ClipboardItem) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ "image/png": blob }),
            ]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2500);
          } else {
            // Fallback to downloading if clipboard image write isn't permitted in browser
            handleDownload();
          }
        } catch (clipErr) {
          console.warn("ClipboardItem write failed, triggering fallback download:", clipErr);
          handleDownload();
        }
      }, "image/png");
    } catch (err) {
      console.error("Copy image error:", err);
    }
  }

  // 3. Save as Lead Magnet OpenGraph (og:image) & Page Cover Image
  async function handleSaveAsOGCover() {
    setIsSavingOG(true);
    try {
      const canvas = await renderCardCanvas(1.5);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!blob) throw new Error("Could not render blob");

      const file = new File([blob], `${page.slug || "lead-magnet"}-og.png`, { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPageAsset", "true");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.fileUrl) {
        const uploadedUrl = data.data.fileUrl;
        if (onSaveAsCover) {
          onSaveAsCover(uploadedUrl);
        }
        setSaveOGSuccess(true);
        setTimeout(() => setSaveOGSuccess(false), 3500);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Save as OG Image error:", err);
      alert("Failed to save as link preview. Please check your network connection.");
    } finally {
      setIsSavingOG(false);
    }
  }

  // 4. One-Click Social Share Intents
  const promoText = `🚀 I just launched "${cardHeadline}"!\n\n${cardSubheadline}\n\n👉 Download your free copy here: ${displayUrl}`;

  function handleShareTwitter() {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(promoText)}`;
    window.open(tweetUrl, "_blank", "width=600,height=500,scrollbars=yes,resizable=yes");
  }

  function handleShareLinkedIn() {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`;
    window.open(liUrl, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  }

  function handleShareFacebook() {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayUrl)}`;
    window.open(fbUrl, "_blank", "width=600,height=500,scrollbars=yes,resizable=yes");
  }

  function handleShareWhatsApp() {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoText)}`;
    window.open(waUrl, "_blank");
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: cardHeadline,
          text: promoText,
          url: displayUrl,
        });
      } catch (err) {
        // User cancelled or share dismissed
      }
    } else {
      handleCopyPromoText();
    }
  }

  function handleCopyPromoText() {
    navigator.clipboard.writeText(promoText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-[#27272A] dark:bg-[#121215]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#27272A] px-3.5 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-[#121215] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 dark:bg-indigo-950/50 shrink-0">
              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                Social Card Studio
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  LIVE
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate hidden xs:block">
                Design & export high-converting preview cards for LinkedIn, X & Stories.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#27272A] dark:hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Sub-Navigation Tabs & Format Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/80 dark:bg-[#18181C] px-3 sm:px-5 py-2 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "styles", label: "Theme & Layout", icon: Palette },
              { id: "content", label: "Card Copy", icon: Type },
              { id: "layers", label: "Visual Layers", icon: Layers },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === tab.id
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-[#27272A] dark:text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                  <IconComp className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Preset Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 p-0.5 rounded-lg shrink-0 overflow-x-auto scrollbar-none">
            {[
              { id: "linkedin", title: "LinkedIn (1:1)", label: "1:1 Square" },
              { id: "twitter", title: "X / Twitter (16:9)", label: "16:9 Landscape" },
              { id: "story", title: "Story (9:16)", label: "9:16 Story" },
              { id: "facebook", title: "Facebook Feed", label: "FB Feed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                title={f.title}
                className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${format === f.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="border-b border-zinc-200 dark:border-[#27272A] bg-white px-3 sm:px-5 py-2.5 dark:bg-[#121215] overflow-x-auto shrink-0">
          {activeTab === "styles" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Theme presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-zinc-500 text-[11px]">Theme:</span>
                {[
                  { id: "gradient", label: "Vibrant Glow" },
                  { id: "sunset", label: "Sunset Fire" },
                  { id: "emerald", label: "Emerald Cyber" },
                  { id: "neon", label: "Midnight" },
                  { id: "dark", label: "Dark Tech" },
                  { id: "minimal", label: "Clean White" },
                  { id: "custom", label: "Custom 🎨" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${theme === t.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Typography pairing & Custom gradient */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-500 text-[11px]">Font:</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    {TYPOGRAPHY_PRESETS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {theme === "custom" && (
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-zinc-500">From:</span>
                      <input
                        type="color"
                        value={colorStart}
                        onChange={(e) => setColorStart(e.target.value)}
                        className="h-4 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-zinc-500">To:</span>
                      <input
                        type="color"
                        value={colorEnd}
                        onChange={(e) => setColorEnd(e.target.value)}
                        className="h-4 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Card Headline / Hook:
                </label>
                <input
                  type="text"
                  value={cardHeadline}
                  onChange={(e) => setCardHeadline(e.target.value)}
                  placeholder="Punchy title..."
                  className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Card Subtitle:
                </label>
                <input
                  type="text"
                  value={cardSubheadline}
                  onChange={(e) => setCardSubheadline(e.target.value)}
                  placeholder="Supporting takeaway..."
                  className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Badge Tag:
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={isCustomBadge ? "custom" : badgeText}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomBadge(true);
                      } else {
                        setIsCustomBadge(false);
                        setBadgeText(e.target.value);
                      }
                    }}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    {BADGE_PRESETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="custom">✏️ Custom...</option>
                  </select>
                  {isCustomBadge && (
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Custom badge..."
                      className="w-24 sm:w-28 rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "layers" && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAvatar}
                  onChange={(e) => setShowAvatar(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Author (@{username})</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBullets}
                  onChange={(e) => setShowBullets(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Highlights Box</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showUrlPill}
                  onChange={(e) => setShowUrlPill(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>URL Link Pill</span>
              </label>
            </div>
          )}
        </div>

        {/* Visual Live Card Canvas / DOM Preview Container */}
        <div className="flex-1 min-h-[260px] overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-center bg-zinc-950/95 relative">
          <div className="w-full flex items-center justify-center">
            <div
              ref={cardRef}
              style={{
                fontFamily: selectedFont,
                ...(theme === "custom"
                  ? { background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`, color: "#ffffff" }
                  : theme === "sunset"
                    ? { background: "linear-gradient(135deg, #F43F5E, #F59E0B)", color: "#ffffff" }
                    : theme === "emerald"
                      ? { background: "linear-gradient(135deg, #0D9488, #059669)", color: "#ffffff" }
                      : theme === "neon"
                        ? { background: "linear-gradient(135deg, #4338CA, #DB2777)", color: "#ffffff" }
                        : undefined),
              }}
              className={`flex flex-col justify-between rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300 relative overflow-hidden w-full ${isLandscape
                ? "max-w-[340px] sm:max-w-[480px] md:max-w-[540px] aspect-[16/9] p-3.5 sm:p-5"
                : format === "story"
                  ? "max-w-[220px] sm:max-w-[280px] md:max-w-[340px] aspect-[9/16] p-4 sm:p-7"
                  : "max-w-[290px] sm:max-w-[350px] md:max-w-[400px] aspect-square p-4 sm:p-6"
                } ${theme === "dark"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : theme === "gradient"
                    ? "bg-gradient-to-br from-[#0066B2] via-purple-600 to-indigo-700 text-white"
                    : theme === "minimal"
                      ? "bg-white text-zinc-950 border-2 sm:border-4 border-zinc-200 shadow-xl"
                      : ""
                }`}
            >
              {/* Card Top / Body */}
              <div className="flex flex-col min-h-0">
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider ${isLandscape ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs"
                      } ${theme === "minimal"
                        ? "bg-indigo-500/10 text-indigo-600"
                        : "bg-white/20 text-white backdrop-blur-md"
                      }`}
                  >
                    <Sparkles className={isLandscape ? "h-2.5 w-2.5" : "h-3 w-3"} /> {badgeText}
                  </span>
                </div>

                <h4 className={`font-black leading-tight tracking-tight ${isLandscape ? "mt-1.5 text-xs sm:text-base line-clamp-2" : "mt-2 sm:mt-3 text-sm sm:text-lg md:text-xl line-clamp-2"
                  }`}>
                  {cardHeadline}
                </h4>

                {cardSubheadline && (
                  <p className={`leading-snug opacity-90 font-medium ${isLandscape ? "mt-0.5 text-[10px] sm:text-xs line-clamp-1" : "mt-1 text-[11px] sm:text-xs line-clamp-2"
                    }`}>
                  {cardSubheadline}
                  </p>
                )}

                {/* Bullets Highlight Box */}
                {showBullets && (
                  <div className={`backdrop-blur-md border ${isLandscape
                    ? "mt-1.5 rounded-lg p-2"
                    : "mt-2 sm:mt-3 rounded-xl p-2.5 sm:p-3"
                    } ${theme === "minimal"
                      ? "bg-zinc-50 border-zinc-200 text-zinc-900"
                      : "bg-white/10 border-white/20 text-white"
                    }`}>
                    <div className={`font-semibold ${isLandscape ? "space-y-0.5 text-[9px] sm:text-[10px]" : "space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs"
                      }`}>
                      {(page.bullets && page.bullets.length > 0
                        ? page.bullets.slice(0, 2)
                        : [
                          "100% actionable framework for immediate results",
                          "Pre-built templates and checklists",
                        ]
                      ).map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-400 font-bold shrink-0">✓</span>
                          <span className="leading-tight line-clamp-1">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Bar */}
              <div className={`flex items-center justify-between gap-1.5 border-t border-current/20 shrink-0 ${isLandscape ? "mt-1.5 pt-1.5" : "mt-2.5 pt-2 sm:mt-3 sm:pt-2.5"
                }`}>
                {showAvatar ? (
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${isLandscape ? "text-[10px]" : "text-[11px] sm:text-xs"}`}>By {creatorName}</p>
                    <p className={`opacity-75 truncate ${isLandscape ? "text-[8px]" : "text-[9px] sm:text-[10px]"}`}>@{username}</p>
                  </div>
                ) : <div />}

                {showUrlPill && (
                  <span className={`rounded-lg bg-white font-bold text-indigo-600 shadow-sm shrink-0 ${isLandscape ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:text-xs"
                    }`}>
                    {cleanUrlDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action & Distribution Bar */}
        <div className="border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50/90 dark:bg-[#18181C] p-3 sm:p-4 flex flex-col gap-2.5 shrink-0">
          {/* Top Actions: Export Buttons & Resolution */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              {/* Resolution Switcher */}
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] sm:text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="1x">Standard (1x)</option>
                <option value="2x">Ultra 4K (2x)</option>
              </select>

              {/* Copy Image to Clipboard Button */}
              <button
                type="button"
                onClick={handleCopyImage}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition shadow-xs cursor-pointer active:scale-95"
              >
                {copiedImage ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden xs:inline">{copiedImage ? "Copied!" : "Copy Image"}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
              {/* Set as Page OG Image / Cover */}
              <button
                type="button"
                onClick={handleSaveAsOGCover}
                disabled={isSavingOG}
                className={`flex items-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${saveOGSuccess
                  ? "bg-emerald-600 text-white"
                  : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950 dark:text-indigo-400"
                  }`}
              >
                {isSavingOG ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveOGSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Set Link Preview</span>
                    <span className="xs:hidden">Set OG</span>
                  </>
                )}
              </button>

              {/* Download PNG Button */}
              <Button onClick={handleDownload} className="py-1.5 px-3 text-xs font-bold">
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </Button>
            </div>
          </div>

          {/* Bottom Social Quick Sharing Bar */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mr-1">
                <Share2 className="h-3 w-3" /> Share:
              </span>

              {/* X / Twitter Intent */}
              <button
                type="button"
                onClick={handleShareTwitter}
                title="Post to X / Twitter"
                className="flex items-center gap-1 rounded-lg bg-black hover:bg-zinc-800 text-white px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X / Tweet</span>
              </button>

              {/* LinkedIn Intent */}
              <button
                type="button"
                onClick={handleShareLinkedIn}
                title="Share on LinkedIn"
                className="flex items-center gap-1 rounded-lg bg-[#0077B5] hover:bg-[#006399] text-white px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>LinkedIn</span>
              </button>

              {/* WhatsApp Intent */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                title="Send to WhatsApp"
                className="flex items-center gap-1 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Smartphone className="h-2.5 w-2.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Copy Post Copy */}
            <button
              type="button"
              onClick={handleCopyPromoText}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold transition shrink-0 cursor-pointer"
            >
              {copiedText ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
              <span>{copiedText ? "Copied!" : "Copy Post Text"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
