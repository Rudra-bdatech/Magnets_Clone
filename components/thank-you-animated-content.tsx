"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Aurora from "./aurora";
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Share2,
  ArrowRight,
  ExternalLink,
  Mail,
  ShieldCheck,
  FileText,
  Zap,
  Lock,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import { type QuizQuestion } from "@/lib/data";

export interface DeliverableResourceItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
}

interface ThankYouAnimatedContentProps {
  subscriberName: string;
  subscriberEmail: string;
  deliverableName: string;
  downloadUrl?: string | null;
  resources?: DeliverableResourceItem[];
  customAnswer?: string | null;
  aiPersonalizedOutput?: string | null;
  brandColor: string;
  themeMode: "light" | "dark";
  logoUrl?: string | null;
  businessName: string;
  pageName: string;
  magnetSlug: string;
  username: string;
  calendarUrl?: string | null;
  afterSignupOption?: "standard" | "elsewhere" | "custom";
  customHeading?: string | null;
  customMessage?: string | null;
  videoUrl?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  quizFunnelEnabled?: boolean;
  quizQuestions?: QuizQuestion[];
}

function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // YouTube watch / short URLs
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }
  // Loom share URLs
  const loomMatch = trimmed.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  // Vimeo URLs
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// Confetti Particle Generator Component
function ConfettiCanvas({ brandColor }: { brandColor: string }) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; vx: number; vy: number; rotation: number }>
  >([]);

  useEffect(() => {
    const colors = [brandColor, "#38BDF8", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"];
    const count = 30;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 350,
      y: (Math.random() - 0.5) * 150 - 50,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -6 - 3,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, [brandColor]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            x: p.x * 2.2,
            y: [p.vy * 8, p.vy * 16 + 250],
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.4],
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: 2.5,
            ease: [0.25, 0.1, 0.25, 1],
            delay: Math.random() * 0.25,
          }}
          className="absolute rounded-sm shadow-sm"
          style={{
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1.4 : 1),
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export default function ThankYouAnimatedContent({
  subscriberName,
  subscriberEmail,
  deliverableName,
  downloadUrl,
  resources = [],
  customAnswer,
  aiPersonalizedOutput,
  brandColor = "#0066B2",
  themeMode = "light",
  logoUrl,
  businessName,
  pageName,
  magnetSlug,
  username,
  calendarUrl,
  afterSignupOption = "standard",
  customHeading,
  customMessage,
  videoUrl,
  buttonLabel,
  buttonUrl,
  quizFunnelEnabled = false,
  quizQuestions = [],
}: ThankYouAnimatedContentProps) {
  const [copiedAi, setCopiedAi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [downloadedResMap, setDownloadedResMap] = useState<Record<string, boolean>>({});
  const [downloadingResId, setDownloadingResId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedDate, setSelectedDate] = useState("Tomorrow");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({}); // questionId -> optionLabel
  const [quizDone, setQuizDone] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizRouteUrl, setQuizRouteUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let resolvedName = subscriberName || "";
    let resolvedEmail = subscriberEmail || "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qName = params.get("name");
      const qEmail = params.get("email");
      if (qName) resolvedName = decodeURIComponent(qName.replace(/\+/g, " "));
      if (qEmail) resolvedEmail = decodeURIComponent(qEmail.replace(/\+/g, " "));
    }
    setClientName(resolvedName);
    setClientEmail(resolvedEmail);
  }, [subscriberName, subscriberEmail]);

  const isDark = themeMode === "dark";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${username}/${magnetSlug}`
      : `/${username}/${magnetSlug}`;

  const handleCopyAiOutput = () => {
    if (!aiPersonalizedOutput) return;
    try {
      navigator.clipboard.writeText(aiPersonalizedOutput);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = aiPersonalizedOutput;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2500);
  };

  const handleCopyShareLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    const targetUrl = downloadUrl || `/r/${magnetSlug}`;

    try {
      setDownloadCompleted(true);
      const link = document.createElement("a");
      link.href = targetUrl;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      if (deliverableName && /\.[a-z0-9]+$/i.test(deliverableName)) {
        link.setAttribute("download", deliverableName);
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {
      window.open(targetUrl, "_blank");
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  const handleDownloadResource = (resItem: DeliverableResourceItem) => {
    setDownloadingResId(resItem.id);
    const targetUrl = resItem.url || `/r/${resItem.id}`;
    try {
      setDownloadedResMap((prev) => ({ ...prev, [resItem.id]: true }));
      const link = document.createElement("a");
      link.href = targetUrl;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      if (resItem.name && /\.[a-z0-9]+$/i.test(resItem.name)) {
        link.setAttribute("download", resItem.name);
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {
      window.open(targetUrl, "_blank");
    } finally {
      setTimeout(() => setDownloadingResId(null), 1000);
    }
  };

  const handleDownloadAll = async () => {
    if (!resources || resources.length === 0) return;
    setDownloadingAll(true);
    for (let i = 0; i < resources.length; i++) {
      const resItem = resources[i];
      handleDownloadResource(resItem);
      if (i < resources.length - 1) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
    setTimeout(() => setDownloadingAll(false), 1500);
  };

  const handleStrategyButtonClick = (e: React.MouseEvent) => {
    if (calendarUrl && calendarUrl.startsWith("http")) {
      window.open(calendarUrl, "_blank");
    } else {
      e.preventDefault();
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingConfirmed(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 py-2 pb-6 px-4 sm:px-6 relative">
      {/* Confetti Explosion Component */}
      <ConfettiCanvas brandColor={brandColor} />

      {/* Background Layer */}
      {isDark ? (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
          <Aurora
            colorStops={[brandColor, "#38BDF8", brandColor]}
            blend={0.7}
            amplitude={1.2}
            speed={0.4}
            lightMode={false}
          />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#FAFAFA]">
          {/* Subtle Top Brand Radial Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] transition-all duration-500"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${brandColor}18 0%, ${brandColor}05 45%, transparent 75%)`,
            }}
          />
          {/* Soft Floating Light Glow Orbs */}
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 left-1/3 w-[500px] h-[500px] rounded-full blur-[130px] opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${brandColor}20 0%, transparent 70%)`,
            }}
          />
          <motion.div
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-28 right-1/4 w-[450px] h-[450px] rounded-full blur-[120px] opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle, #38BDF820 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Top Hero Checkmark Badge */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: -15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
        className="flex flex-col items-center text-center space-y-2 relative z-10"
      >
        <div className="relative flex items-center justify-center">
          {/* Multi-layered Pulsing Rings */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-14 w-14 rounded-full blur-xl"
            style={{ backgroundColor: brandColor }}
          />

          <div
            className={`relative flex h-12 w-12 p-2.5 items-center justify-center rounded-2xl shadow-xl border backdrop-blur-xl ${isDark ? "bg-[#141417]/90 border-white/10" : "bg-white/90 border-zinc-200"
              }`}
            style={{
              boxShadow: `0 12px 28px -6px ${brandColor}45`,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: brandColor }} />
            </motion.div>
          </div>
        </div>

        <motion.div
          suppressHydrationWarning
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-1.5 max-w-2xl"
        >
          <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold tracking-wide uppercase shadow-sm border backdrop-blur-md ${isDark
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-sky-500/15 text-sky-800 border-sky-600/40 shadow-xs"
            }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDark ? "bg-emerald-500" : "bg-sky-500"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDark ? "bg-emerald-500" : "bg-sky-600"}`}></span>
            </span>
            Access Confirmed & Delivered
          </div>

          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-zinc-950"}`}>
            {afterSignupOption === "custom" && customHeading ? (
              customHeading
            ) : (
              <span>You&apos;re All Set{mounted && clientName ? `, ${clientName}` : ""}! 🎉</span>
            )}
          </h1>

          <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
            We&apos;ve dispatched your copy of{" "}
            <span className={`font-extrabold underline ${isDark ? "text-white" : "text-zinc-950"}`} style={{ textDecorationColor: brandColor }}>
              {`"${pageName}"`}
            </span>{" "}
            to <span className={`font-bold underline ${isDark ? "text-white" : "text-zinc-950"}`} style={{ textDecorationColor: brandColor }}>{mounted && clientEmail ? clientEmail : "your inbox"}</span>.
          </p>
        </motion.div>

        {/* Live Delivery Status Timeline Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className={`w-full max-w-xl rounded-2xl border py-2 px-4 flex items-center justify-between text-xs backdrop-blur-xl transition-all ${isDark
              ? "bg-[#12131a]/75 border-white/10 text-zinc-300 shadow-lg"
              : "bg-white/90 border-zinc-300 text-zinc-900 shadow-md"
            }`}
          style={{
            boxShadow: isDark
              ? "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)"
              : "0 4px 15px -3px rgba(0, 0, 0, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-extrabold text-[9px]">
              ✓
            </div>
            <span className={`font-extrabold text-[11px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>1. Signed Up</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-gradient-to-r from-emerald-500 to-emerald-500" />

          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-extrabold text-[9px]">
              ✓
            </div>
            <span className={`font-extrabold text-[11px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>2. Asset Generated</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${downloadCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-sky-500"}`} />

          <div className="flex items-center gap-1.5">
            <div className={`h-4 w-4 rounded-full flex items-center justify-center font-extrabold text-[9px] transition-colors duration-300 ${downloadCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-sky-500/20 text-sky-500"}`}>
              {downloadCompleted ? "✓" : "⚡"}
            </div>
            <span className={`text-[11px] font-extrabold transition-colors duration-300 ${downloadCompleted ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-zinc-200" : "text-zinc-950")}`}>
              3. Instant Download {downloadCompleted ? "(Completed)" : ""}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Cards Container */}
      <div className="max-w-2xl mx-auto space-y-3.5 relative z-10">
        {/* Custom Next Step Card (When Creator Configures Custom Offer / Message / Video / CTA) */}
        {afterSignupOption === "custom" && (customMessage || videoUrl || buttonLabel || buttonUrl) && (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={`rounded-2xl border p-5 sm:p-7 space-y-4 backdrop-blur-xl relative overflow-hidden transition-all ${isDark
                ? "bg-[#111218]/90 border-white/15 text-white shadow-2xl"
                : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
              }`}
            style={{
              boxShadow: isDark
                ? `0 20px 45px -10px ${brandColor}35`
                : `0 20px 40px -10px ${brandColor}20`,
            }}
          >
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, #38BDF8, #8B5CF6, ${brandColor})`,
              }}
            />

            {/* Custom Next Step Header Badge */}
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md"
                style={{ backgroundColor: brandColor }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: brandColor }}>
                  Next Step Recommendation
                </span>
              </div>
            </div>

            {/* Custom Message */}
            {customMessage && (
              <p className={`text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                {customMessage}
              </p>
            )}

            {/* Video Embed Player */}
            {videoUrl && getEmbedUrl(videoUrl) && (
              <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-video bg-black relative">
                <iframe
                  src={getEmbedUrl(videoUrl)!}
                  title="Next Step Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {/* Action CTA Button */}
            {(buttonUrl || buttonLabel) && (
              <div className="pt-2">
                <a
                  href={buttonUrl ? (buttonUrl.startsWith("http://") || buttonUrl.startsWith("https://") ? buttonUrl : `https://${buttonUrl}`) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full relative overflow-hidden rounded-xl py-3.5 px-6 font-black text-sm text-white shadow-xl transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] cursor-pointer flex items-center justify-center gap-2.5 border border-white/20 select-none group"
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 8px 25px -4px ${brandColor}70`,
                  }}
                >
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                  />
                  <span className="tracking-wide">{buttonLabel || "Continue to Next Step"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Download Box - Adaptive Single vs Multi-Resource */}
        {resources && resources.length > 1 ? (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden transition-all ${isDark
                ? "bg-[#111218]/80 border-white/10 text-white shadow-xl"
                : "bg-white/85 border-zinc-200 text-zinc-900 shadow-md"
              }`}
            style={{
              boxShadow: isDark
                ? `0 15px 35px -10px ${brandColor}30`
                : `0 15px 30px -10px ${brandColor}15`,
            }}
          >
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, #38BDF8, ${brandColor})`,
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  Direct High-Speed Downloads ({resources.length} Files Available)
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {downloadingAll ? (
                  <Check className="h-3.5 w-3.5 animate-bounce" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{downloadingAll ? "Downloading All..." : "⚡ Download All Files"}</span>
              </button>
            </div>

            {/* List of Resource Cards */}
            <div className={`space-y-2.5 pt-1 ${resources.length > 3 ? "max-h-[290px] sm:max-h-[330px] overflow-y-auto pr-1.5 scrollbar-thin" : ""}`}>
              {resources.map((resItem, idx) => {
                const isDownloaded = downloadedResMap[resItem.id];
                const isDownloading = downloadingResId === resItem.id;
                return (
                  <div
                    key={resItem.id || idx}
                    className={`rounded-xl border p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all ${isDark
                        ? "bg-[#18181C]/90 border-white/10 hover:border-white/20"
                        : "bg-zinc-50/90 border-zinc-200/80 hover:border-zinc-300"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs text-white font-bold"
                        style={{
                          backgroundColor: `${brandColor}25`,
                          color: brandColor,
                          border: `1px solid ${brandColor}40`,
                        }}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-bold truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
                          {resItem.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          Instant Access · Direct File Download
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadResource(resItem)}
                      disabled={isDownloading}
                      className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] border"
                      style={{
                        backgroundColor: isDownloaded ? "transparent" : brandColor,
                        color: isDownloaded ? (isDark ? "#34D399" : "#059669") : "#ffffff",
                        borderColor: isDownloaded ? (isDark ? "#059669" : "#10B981") : `${brandColor}80`,
                      }}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Downloaded</span>
                        </>
                      ) : (
                        <>
                          <Download className={`h-3.5 w-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                          <span>{isDownloading ? "Downloading..." : "Download"}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={`mt-3.5 flex items-center justify-between text-xs font-medium pt-2.5 border-t ${isDark ? "text-zinc-400 border-white/10" : "text-zinc-600 border-zinc-200/60"}`}>
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                <ShieldCheck className="h-4 w-4" /> 100% Virus-Free & Direct Links
              </span>
              <span className={`flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                <Lock className="h-3.5 w-3.5" /> SSL Secured
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-xl border p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden transition-all ${isDark
                ? "bg-[#111218]/80 border-white/10 text-white shadow-xl"
                : "bg-white/85 border-zinc-200 text-zinc-900 shadow-md"
              }`}
            style={{
              boxShadow: isDark
                ? `0 15px 35px -10px ${brandColor}30`
                : `0 15px 30px -10px ${brandColor}15`,
            }}
          >
            {/* Subtle Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, #38BDF8, ${brandColor})`,
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  Direct High-Speed Download
                </span>
              </div>
            </div>

            {/* Shimmer CTA Download Button */}
            <div className="flex justify-center w-full pt-1">
              <button
                onClick={handleDownloadClick}
                disabled={downloading}
                className="w-full max-w-md relative overflow-hidden rounded-xl py-3 px-5 font-bold text-sm text-white shadow-md transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] cursor-pointer flex items-center justify-center gap-2 border border-white/20 select-none"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 4px 14px -3px ${brandColor}60`,
                }}
              >
                {/* Button Light Shimmer Effect */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
                />

                {downloadCompleted ? (
                  <Check className="h-4 w-4 text-emerald-300 shrink-0 pointer-events-none" />
                ) : (
                  <Download className={`h-4 w-4 shrink-0 pointer-events-none ${downloading ? "animate-bounce" : ""}`} />
                )}
                <span className="tracking-wide text-sm font-semibold truncate pointer-events-none">
                  {downloading ? "Preparing Download..." : downloadCompleted ? `File Downloaded ("${deliverableName}")` : `Download "${deliverableName}" Now`}
                </span>
              </button>
            </div>

            <div className={`mt-3.5 flex items-center justify-between text-xs font-medium pt-2.5 border-t ${isDark ? "text-zinc-400 border-white/10" : "text-zinc-600 border-zinc-200/60"}`}>
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                <ShieldCheck className="h-4 w-4" /> 100% Virus-Free & Direct Link
              </span>
              <span className={`flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                <Lock className="h-3.5 w-3.5" /> SSL Secured
              </span>
            </div>
          </motion.div>
        )}

        {/* AI Personalized Output Card (If Prompt Output Exists) */}
        {aiPersonalizedOutput && (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`rounded-2xl border p-5 space-y-3.5 backdrop-blur-2xl transition-all ${isDark
                ? "bg-[#111218]/80 border-amber-500/30 text-white shadow-xl"
                : "bg-gradient-to-br from-amber-500/10 via-white/85 to-white/75 border-amber-500/30 text-zinc-900 shadow-md"
              }`}
            style={{
              boxShadow: isDark
                ? `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`
                : `0 15px 30px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)`,
            }}
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center shadow-md">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-1">
                    Custom AI-Generated Result
                  </h3>
                  {customAnswer && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                      Customized for: "{customAnswer}"
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyAiOutput}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-sm transition cursor-pointer"
              >
                {copiedAi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedAi ? "Copied!" : "Copy"}
              </motion.button>
            </div>

            <div
              className={`p-3.5 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border shadow-inner ${isDark ? "bg-[#0A0A0C]/70 text-zinc-200 border-white/5" : "bg-zinc-50/70 text-zinc-800 border-zinc-200"
                }`}
            >
              {aiPersonalizedOutput}
            </div>
          </motion.div>
        )}

        {/* Social Share & Spread the Word Card */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className={`rounded-xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 backdrop-blur-xl transition-all ${isDark
              ? "bg-[#111218]/80 border-white/10 text-white shadow-lg"
              : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
            }`}
          style={{
            boxShadow: isDark
              ? `0 10px 25px -5px rgba(0, 0, 0, 0.4)`
              : `0 8px 20px -5px rgba(0, 0, 0, 0.05)`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/20">
              <Share2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xs sm:text-sm font-extrabold truncate ${isDark ? "text-white" : "text-zinc-900"}`}>Spread the Word & Help Others</h3>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"} truncate`}>
                Know colleagues or friends who would benefit from this free guide?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this free resource: ${pageName}`)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              aria-label="Share on X"
              className="h-9 w-9 rounded-lg flex items-center justify-center bg-black text-white hover:bg-zinc-800 border border-white/15 transition-all hover:scale-105 shadow-sm cursor-pointer shrink-0"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on LinkedIn"
              aria-label="Share on LinkedIn"
              className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#0A66C2] text-white hover:bg-[#084e96] border border-white/10 transition-all hover:scale-105 shadow-sm cursor-pointer shrink-0"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>

            <button
              onClick={handleCopyShareLink}
              title={copiedLink ? "Link Copied!" : "Copy Page Link"}
              aria-label="Copy Page Link"
              className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all hover:scale-105 shadow-sm cursor-pointer shrink-0 ${isDark ? "border-white/15 bg-white/10 hover:bg-white/20 text-white" : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                }`}
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        {/* ── Quiz Funnel Card ────────────────────────────────────────────── */}
        {quizFunnelEnabled && quizQuestions.length > 0 && (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden transition-all ${
              isDark
                ? "bg-[#111218]/90 border-white/15 text-white shadow-2xl"
                : "bg-white/95 border-zinc-200 text-zinc-900 shadow-xl"
            }`}
            style={{
              boxShadow: isDark
                ? `0 20px 45px -10px ${brandColor}35`
                : `0 20px 40px -10px ${brandColor}20`,
            }}
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(90deg, ${brandColor}, #38BDF8, #8B5CF6, ${brandColor})`,
              }}
            />

            {!quizDone ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: brandColor }}>
                      Quick Survey — Question {quizCurrentQ + 1} of {quizQuestions.length}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-zinc-100"}`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: brandColor }}
                    initial={{ width: `${(quizCurrentQ / quizQuestions.length) * 100}%` }}
                    animate={{ width: `${((quizCurrentQ + 1) / quizQuestions.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quizCurrentQ}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <p className={`text-sm sm:text-base font-bold leading-snug ${isDark ? "text-white" : "text-zinc-900"}`}>
                      {quizQuestions[quizCurrentQ].question || `Question ${quizCurrentQ + 1}`}
                    </p>

                    <div className="space-y-2">
                      {quizQuestions[quizCurrentQ].options.map((opt, idx) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const q = quizQuestions[quizCurrentQ];
                            const newAnswers = { ...quizAnswers, [q.id]: opt.label };
                            setQuizAnswers(newAnswers);

                            // Track route URL from selected option
                            if (opt.routeUrl && opt.routeUrl.trim()) {
                              setQuizRouteUrl(opt.routeUrl.trim());
                            }

                            const isLast = quizCurrentQ === quizQuestions.length - 1;
                            if (!isLast) {
                              setQuizCurrentQ((prev) => prev + 1);
                            } else {
                              // All questions answered — save to lead record
                              setQuizSaving(true);
                              const params = typeof window !== "undefined"
                                ? new URLSearchParams(window.location.search)
                                : new URLSearchParams();
                              const leadEmail = params.get("email") || clientEmail || "";
                              const pageId = params.get("pageId") || "";
                              if (leadEmail) {
                                fetch("/api/data", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "saveLeadQuizAnswers",
                                    data: {
                                      email: leadEmail,
                                      pageId,
                                      quizAnswers: newAnswers,
                                    },
                                  }),
                                })
                                  .catch(() => {})
                                  .finally(() => {
                                    setQuizSaving(false);
                                    setQuizDone(true);
                                  });
                              } else {
                                setQuizSaving(false);
                                setQuizDone(true);
                              }
                            }
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer group flex items-center gap-3 ${
                            isDark
                              ? "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-zinc-200"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white text-zinc-800"
                          }`}
                        >
                          <span
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 text-white"
                            style={{ backgroundColor: brandColor }}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{opt.label || `Option ${String.fromCharCode(65 + idx)}`}</span>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: brandColor }} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              /* Quiz Complete state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-center py-4 space-y-3"
              >
                <div
                  className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl"
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 10px 25px -5px ${brandColor}60`,
                  }}
                >
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${isDark ? "text-white" : "text-zinc-900"}`}>
                    Thanks for completing the survey!
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {quizSaving ? "Saving your answers..." : "Your answers have been saved."}
                  </p>
                </div>
                {quizRouteUrl && (
                  <a
                    href={/^https?:\/\//i.test(quizRouteUrl) ? quizRouteUrl : `https://${quizRouteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Return Home Link */}
        <div className="text-center pt-1">
          <a
            href={`/${username}/${magnetSlug}`}
            className={`inline-flex items-center gap-1.5 text-xs font-bold hover:underline transition-colors ${isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
              }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Original Magnet Page
          </a>
        </div>
      </div>

      {/* Strategy Session Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative space-y-5 ${isDark ? "bg-[#141417] border-white/15 text-white" : "bg-white border-zinc-200 text-zinc-900"
                }`}
            >
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>

              {bookingConfirmed ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Strategy Session Reserved!</h3>
                  <p className="text-xs text-zinc-400">
                    We've saved your slot for <strong>{selectedDate} at {selectedTime}</strong>. Confirmation link sent to {subscriberEmail || "your email"}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Reserve 1-on-1 Session</h3>
                      <p className="text-xs text-zinc-400">Choose your preferred strategy call slot with {businessName}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400">Select Date:</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {["Today", "Tomorrow", "In 2 Days"].map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDate(d)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${selectedDate === d
                                ? "bg-[#0066B2] text-white border-sky-400"
                                : isDark
                                  ? "bg-[#1C1C22] border-white/10 text-zinc-300 hover:border-white/20"
                                  : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                              }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400">Select Time Slot:</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {["10:00 AM", "02:00 PM", "05:30 PM"].map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${selectedTime === t
                                ? "bg-[#0066B2] text-white border-sky-400"
                                : isDark
                                  ? "bg-[#1C1C22] border-white/10 text-zinc-300 hover:border-white/20"
                                  : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-98 cursor-pointer mt-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    Confirm Meeting ({selectedDate} @ {selectedTime})
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
