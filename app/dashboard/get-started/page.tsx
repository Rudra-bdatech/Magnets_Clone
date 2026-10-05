"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  FileText,
  Rocket,
  Mail,
  Palette,
  Sliders,
  ArrowRight,
  Sparkles,
  ChevronRight,
  PartyPopper,
  Zap,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  loadPages,
  loadSequences,
  loadAccount,
  loadIntegrations,
  syncWithDatabase,
} from "@/lib/store";
import {
  computeOnboardingStatus,
  type OnboardingStatus,
  type OnboardingStep,
} from "@/lib/onboarding";
import type { Account, MagnetPage, Sequence, Integration } from "@/lib/data";

const iconMap = {
  FileText: FileText,
  Rocket: Rocket,
  Mail: Mail,
  Palette: Palette,
  Sliders: Sliders,
};

export default function GetStartedPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(() => {
    const acc = loadAccount();
    const p = loadPages();
    const s = loadSequences();
    const i = loadIntegrations();

    setAccount(acc);
    setPages(p);
    setSequences(s);
    setIntegrations(i);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();

    // Initial background sync
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        if (data.pages) setPages(data.pages);
        if (data.sequences) setSequences(data.sequences);
        if (data.integrations) setIntegrations(data.integrations);
      }
    });

    // Real-time synchronization
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "currentUserPages" ||
        e.key === "currentUserAccount" ||
        e.key === "currentUserSequences" ||
        e.key === "currentUserIntegrations" ||
        e.key === "leadmagnets_last_sync"
      ) {
        refreshData();
      }
    };

    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel("leadmagnets_live_sync");
        bc.onmessage = () => {
          refreshData();
        };
      }
    } catch (_) {}

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [refreshData]);

  const status: OnboardingStatus = computeOnboardingStatus({
    pages,
    sequences,
    account,
    integrations,
  });

  useEffect(() => {
    if (!loading && status.isAllCompleted) {
      router.replace("/dashboard");
    }
  }, [loading, status.isAllCompleted, router]);

  if (!loading && status.isAllCompleted) {
    return null;
  }

  return (
    <DashboardShell account={account} title="Get Started" activeNavHref="/dashboard/get-started">
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#F8FBFF] dark:bg-[#0B0B0D] py-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-zinc-900 dark:text-white font-semibold">Get Started</span>
          </nav>

          {/* Hero Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Let&apos;s get LeadMagnets working for you
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              A few quick steps unlock the full LeadMagnets workflow — from lead magnet creation to automated lead capture. You can return to this page any time.
            </p>
          </div>

          {/* Progress Bar Banner */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold mb-2.5">
              <span className="text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                Getting Started Progress
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                {status.completedCount} of {status.totalCount} completed ({status.progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${status.progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#0066B2] to-[#38BDF8] rounded-full"
              />
            </div>
          </div>

          {/* Completed State Congratulatory Card */}
          {status.isAllCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <PartyPopper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    You&apos;re completely all set! 🎉
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    All onboarding tasks are finished. This dedicated setup tab is now complete and will automatically retire from the primary navigation menu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#0066B2] text-white text-xs font-bold hover:bg-[#005291] transition cursor-pointer shadow-sm"
              >
                Go to Dashboard →
              </button>
            </motion.div>
          )}

          {/* Step Cards List */}
          <div className="space-y-3.5">
            {status.steps.map((step: OnboardingStep, index: number) => {
              const Icon = iconMap[step.iconName] || FileText;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    step.done
                      ? "bg-white/80 dark:bg-[#18181B]/80 border-zinc-200/80 dark:border-white/10"
                      : "bg-white dark:bg-[#18181B] border-[#0066B2]/30 dark:border-[#0066B2]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Checkmark Indicator */}
                    <div className="pt-0.5">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h2 className={`text-sm sm:text-base font-bold ${
                          step.done
                            ? "text-zinc-700 dark:text-zinc-200"
                            : "text-zinc-900 dark:text-white"
                        }`}>
                          {step.title}
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          {step.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="sm:self-center w-full sm:w-auto pt-2 sm:pt-0 pl-9 sm:pl-0">
                    <Link
                      href={step.href}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all w-full sm:w-auto cursor-pointer ${
                        step.done
                          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/5"
                          : "bg-[#0066B2] hover:bg-[#005291] text-white shadow-xs hover:shadow-[0_4px_14px_rgba(0,102,178,0.3)] hover:-translate-y-0.5"
                      }`}
                    >
                      <span>{step.ctaText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
