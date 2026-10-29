"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  QrCode,
  Trash2,
  ArrowLeft,
  X,
  Copy,
  Check,
  Download,
  Lock,
  Sparkles,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { type MagnetPage, type Account } from "@/lib/data";

interface QRCodeDropdownProps {
  page: MagnetPage;
  account: Account | null;
  isLockedPdf?: boolean;
  onAnalytics: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface ThemePreset {
  id: string;
  name: string;
  cardBg: string;
  textColor: string;
  subtextColor: string;
  badgeBg: string;
  qrBoxBg: string;
  borderClass: string;
  showCenterDot: boolean;
  dotColor?: string;
  canvasBg: string | [string, string, string];
  canvasText: string;
  canvasSubtext: string;
}

const THEMES: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    cardBg: "bg-white text-zinc-900 border border-zinc-200 shadow-sm",
    textColor: "text-zinc-900",
    subtextColor: "text-zinc-500",
    badgeBg: "bg-zinc-100 text-zinc-700 border-zinc-200",
    qrBoxBg: "bg-white border-zinc-100 shadow-xs",
    borderClass: "border-zinc-200",
    showCenterDot: false,
    canvasBg: "#FFFFFF",
    canvasText: "#09090B",
    canvasSubtext: "#71717A",
  },
  {
    id: "dark",
    name: "Dark",
    cardBg: "bg-[#18181B] text-white border border-zinc-800 shadow-md",
    textColor: "text-white",
    subtextColor: "text-zinc-400",
    badgeBg: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
    qrBoxBg: "bg-white border-white/10 shadow-md",
    borderClass: "border-zinc-800",
    showCenterDot: false,
    canvasBg: "#18181B",
    canvasText: "#FFFFFF",
    canvasSubtext: "#A1A1AA",
  },
  {
    id: "sunset",
    name: "Gradient",
    cardBg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white border border-white/20 shadow-md",
    textColor: "text-white",
    subtextColor: "text-white/85",
    badgeBg: "bg-black/25 text-white border-white/20",
    qrBoxBg: "bg-white border-black/5 shadow-md",
    borderClass: "border-white/20",
    showCenterDot: true,
    dotColor: "#FD1D1D",
    canvasBg: ["#833AB4", "#FD1D1D", "#FCB045"],
    canvasText: "#FFFFFF",
    canvasSubtext: "rgba(255, 255, 255, 0.85)",
  },
];

export default function QRCodeDropdown({
  page,
  account,
  isLockedPdf = false,
  onAnalytics,
  onDelete,
  onClose,
}: QRCodeDropdownProps) {
  const [view, setView] = useState<"menu" | "qr">("menu");
  // Default to Classic Black & White
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEMES[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Compute public destination URL
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";

  const publicUrl = isLockedPdf
    ? `${origin}/pdf-viewer/${page.id}`
    : `${origin}/${account?.username || "user"}/${page.slug}`;

  const cleanDisplayUrl = isLockedPdf
    ? `${origin.replace(/^https?:\/\//, "")}/pdf-viewer/${page.id}`
    : `${origin.replace(/^https?:\/\//, "")}/${account?.username || "user"}/${page.slug}`;

  // Generate clean, high-contrast QR Code data URL
  useEffect(() => {
    if (!publicUrl) return;

    QRCode.toDataURL(publicUrl, {
      width: 480,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Failed to generate QR code", err));
  }, [publicUrl]);

  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = publicUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    }
  };

  // Instant blob download of QR Card directly to user's computer without opening any new tab
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 600;
      const height = 750;
      canvas.width = width;
      canvas.height = height;

      // 1. Draw Card Background
      const radius = 32;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height - radius);
      ctx.quadraticCurveTo(width, height, width - radius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();

      if (Array.isArray(selectedTheme.canvasBg)) {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, selectedTheme.canvasBg[0]);
        grad.addColorStop(0.5, selectedTheme.canvasBg[1]);
        grad.addColorStop(1, selectedTheme.canvasBg[2]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = selectedTheme.canvasBg;
      }
      ctx.fill();

      // Border outline
      ctx.strokeStyle =
        selectedTheme.id === "classic"
          ? "#E4E4E7"
          : selectedTheme.id === "dark"
          ? "#27272A"
          : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = selectedTheme.id === "classic" ? 3 : 2;
      ctx.stroke();

      // 2. Header Title
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = selectedTheme.canvasText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const title = (page.name || "Lead Magnet").slice(0, 30);
      ctx.fillText(title, width / 2, 60);

      // Handle
      ctx.font = "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = selectedTheme.canvasSubtext;
      ctx.fillText(`@${account?.username || "creator"}`, width / 2, 95);

      // 3. Center QR Box
      const qrBoxSize = 360;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 130;

      if (selectedTheme.id !== "classic") {
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
      } else {
        ctx.shadowColor = "rgba(0,0,0,0.04)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
      }

      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, [24]);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Draw QR Code Image into box
      if (qrDataUrl) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const pad = 20;
            ctx.drawImage(img, qrBoxX + pad, qrBoxY + pad, qrBoxSize - pad * 2, qrBoxSize - pad * 2);
            resolve();
          };
          img.src = qrDataUrl;
        });
      }

      // Center accent dot (only if enabled on theme)
      if (selectedTheme.showCenterDot && selectedTheme.dotColor) {
        ctx.beginPath();
        ctx.arc(width / 2, qrBoxY + qrBoxSize / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = selectedTheme.dotColor;
        ctx.fill();
      }

      // 4. Footer text
      ctx.fillStyle = selectedTheme.canvasText;
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Scan with phone camera", width / 2, 535);

      ctx.font = "500 14px ui-monospace, monospace";
      ctx.fillStyle = selectedTheme.canvasSubtext;
      const shortUrl = cleanDisplayUrl.length > 36 ? cleanDisplayUrl.slice(0, 36) + "..." : cleanDisplayUrl;
      ctx.fillText(shortUrl, width / 2, 565);

      // 5. Download PNG file
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${page.slug || "lead-magnet"}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Failed to download QR image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // 1. STANDARD DROPDOWN MENU VIEW
  if (view === "menu") {
    return (
      <div className="absolute right-0 top-9 w-48 rounded-2xl border p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-200">
        <button
          onClick={onAnalytics}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <BarChart2 className="h-4 w-4 text-zinc-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setView("qr")}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <QrCode className="h-4 w-4 text-zinc-400" />
          <span>Download QR code</span>
        </button>

        <div className="my-1 h-px bg-zinc-200 dark:bg-white/10" />

        <button
          onClick={onDelete}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
        >
          <Trash2 className="h-4 w-4 text-red-400" />
          <span>Delete lead magnet</span>
        </button>
      </div>
    );
  }

  // 2. IN-DROPDOWN COMPACT QR CARD VIEW (Normal B&W Default)
  return (
    <div className="absolute right-0 top-9 w-[280px] sm:w-[300px] rounded-2xl border p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100">
      {/* Sub-header inside dropdown */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/10">
        <button
          onClick={() => setView("menu")}
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3 stroke-[2.5px]" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold text-zinc-800 dark:text-white">QR Code</span>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* QR Code Presentation Card */}
      <div
        className={`relative mt-2.5 rounded-2xl p-3 text-center transition-all duration-200 select-none ${selectedTheme.cardBg}`}
      >
        {/* Badge & Title */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${selectedTheme.badgeBg}`}
          >
            {isLockedPdf ? <Lock className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
            <span>{isLockedPdf ? "Locked PDF" : "Lead Magnet"}</span>
          </div>

          <p className={`mt-1.5 text-xs font-bold line-clamp-1 max-w-[220px] ${selectedTheme.textColor}`}>
            {page.name || "Untitled Resource"}
          </p>
          <span className={`text-[10px] font-medium ${selectedTheme.subtextColor}`}>
            @{account?.username || "creator"}
          </span>
        </div>

        {/* Center QR Code (Clean Black & White) */}
        <div className="relative z-10 my-2.5 flex items-center justify-center">
          <div className={`relative rounded-xl p-2.5 ${selectedTheme.qrBoxBg}`}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="h-32 w-32 object-contain rounded"
              />
            ) : (
              <div className="h-32 w-32 flex items-center justify-center text-zinc-400">
                <QrCode className="h-8 w-8 animate-pulse text-zinc-300" />
              </div>
            )}

            {/* Optional dot only if theme enables it */}
            {selectedTheme.showCenterDot && selectedTheme.dotColor && (
              <div
                className="absolute h-4 w-4 rounded-full bg-white shadow-xs flex items-center justify-center pointer-events-none"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: selectedTheme.dotColor }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`flex items-center gap-1 text-[10px] font-bold ${selectedTheme.textColor}`}>
            <Smartphone className="h-3 w-3 stroke-[2.5px]" />
            <span>Scan with phone camera</span>
          </div>
          <span className={`text-[9px] font-mono mt-0.5 truncate max-w-[220px] ${selectedTheme.subtextColor}`}>
            {cleanDisplayUrl}
          </span>
        </div>
      </div>

      {/* Style selector pills (Default: Classic B&W) */}
      <div className="mt-2.5 flex items-center justify-between px-0.5">
        <span className="text-[10px] text-zinc-400 font-medium">Style:</span>
        <div className="flex items-center gap-1">
          {THEMES.map((theme) => {
            const active = selectedTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition cursor-pointer ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {theme.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons row */}
      <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/10">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition cursor-pointer active:scale-95 border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500 stroke-[3px]" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-zinc-400" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !qrDataUrl}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#FE6F34] hover:bg-[#e86026] text-black px-2 py-1.5 text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <div className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Download className="h-3 w-3 stroke-[2.5px]" />
              <span>Download</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
