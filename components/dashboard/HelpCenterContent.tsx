"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExpandableScreenContent } from "@/components/ui/expandable-screen";
import {
  BookOpen,
  Gift,
  Sliders,
  Lightbulb,
  Compass,
  FileText,
  FolderOpen,
  Palette,
  Send,
  GitFork,
  Calendar,
  Settings,
  Globe,
  Mail,
  Share2,
  Cpu,
  Slack,
  Zap,
  Link as LinkIcon,
  BarChart3,
  User,
  PlayCircle,
  ListChecks,
  X,
  ArrowLeft,
  ExternalLink,
  Search,
  ChevronRight,
  Sparkles,
  Rocket,
  CheckCircle2,
  Lock,
  FileLock,
  Users
} from "lucide-react";

interface HelpCenterContentProps {
  onClose: () => void;
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  onCreateMagnet?: () => void;
}

const helpTopics = {
  learn: {
    title: "LEARN",
    count: "4 topics",
    items: [
      { text: "What is a lead magnet?", icon: "BookOpen" },
      { text: "Why use a lead magnet?", icon: "Gift" },
      { text: "How do they work?", icon: "Sliders" },
      { text: "What works best?", icon: "Lightbulb" },
    ],
  },
  build: {
    title: "BUILD",
    count: "7 topics",
    items: [
      { text: "Create your first lead magnet", icon: "Compass" },
      { text: "Edit and publish a magnet", icon: "FileText" },
      { text: "Assets", icon: "FolderOpen" },
      { text: "Brand colours and logo", icon: "Palette" },
      { text: "Delivery emails", icon: "Send" },
      { text: "Follow-up sequences", icon: "GitFork" },
      { text: "After-signup experience", icon: "Calendar" },
    ],
  },
  setup: {
    title: "SET UP",
    count: "4 topics",
    items: [
      { text: "Integration", icon: "Settings" },
      { text: "Custom domains", icon: "Globe" },
      { text: "Send from my email", icon: "Mail" },
      { text: "Legal links", icon: "BookOpen" },
    ],
  },
  connections: {
    title: "CONNECTIONS",
    count: "6 topics",
    items: [
      { text: "Substack and Kit", icon: "Share2" },
      { text: "Connect Kit", icon: "Cpu" },
      { text: "Connect Slack", icon: "Slack" },
      { text: "Connect Zapier", icon: "Zap" },
      { text: "Connect Pipedrive", icon: "Link" },
      { text: "Connect a calendar", icon: "Calendar" },
    ],
  },
  manage: {
    title: "MANAGE",
    count: "4 topics",
    items: [
      { text: "Manage leads", icon: "Users" },
      { text: "Analytics and A/B tests", icon: "BarChart3" },
      { text: "Account settings", icon: "User" },
      { text: "Video walkthrough", icon: "PlayCircle" },
    ],
  },
};

const allTopicsList = [
  ...helpTopics.learn.items,
  ...helpTopics.build.items,
  ...helpTopics.setup.items,
  ...helpTopics.connections.items,
  ...helpTopics.manage.items,
];

export default function HelpCenterContent({
  onClose,
  selectedTopic,
  setSelectedTopic,
  onCreateMagnet,
}: HelpCenterContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const setShowHelp = (val: boolean) => {
    if (!val) onClose();
  };
  const setShowCreateMagnetModal = (val: boolean) => {
    if (val && onCreateMagnet) onCreateMagnet();
  };

  const filteredTopics = searchQuery
    ? allTopicsList.filter((item) => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
        <ExpandableScreenContent className="border border-[#0066B2]/30 bg-white text-zinc-900 shadow-2xl dark:border-[#0066B2]/35 dark:bg-[#18181c] dark:text-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#0066B2]/30 dark:border-[#0066B2]/35 px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2] text-white shadow-sm">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Help centre</h3>
                <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">Learn the basics or find your next step.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowHelp(false);
                setSelectedTopic(null);
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub-header navigation when inside a topic */}
          {selectedTopic && (
            <div className="flex items-center justify-between border-b border-[#0066B2]/30 dark:border-[#0066B2]/35 bg-transparent px-6 py-2.5">
              <button
                onClick={() => setSelectedTopic(null)}
                className="flex items-center gap-2.5 rounded-lg bg-transparent px-4 py-2 ml-6 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#d4c8bc] dark:hover:bg-[#282830] dark:hover:text-white transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-[#9B9085]" />
                <span>All help topics</span>
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-[#666675] mr-4">LEARN</span>
            </div>
          )}

          {/* Modal Scroll Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" data-lenis-prevent>
            {selectedTopic === "Video walkthrough" ? (
              <div className="max-w-[42rem] mx-auto space-y-6 py-2">
                {/* Header: WATCH THE FULL FLOW */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">WATCH THE FULL FLOW</p>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight mt-1">Platform walkthrough</h2>
                  </div>

                  <a
                    href="https://www.loom.com/share/ebb8dded5142439d8a97e338a49cb104"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-[#9B9085] hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <span>Open in Loom</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Video Mockup Player Container */}
                <div className="relative overflow-hidden rounded-2xl border border-[#2e2e38] bg-[#161619] shadow-2xl flex flex-col">
                  {/* Embedded Video Viewport */}
                  <div className="relative h-[320px] max-h-[350px] w-full bg-[#18181c] overflow-hidden flex flex-col justify-between group">
                    <iframe
                      src="https://www.loom.com/embed/ebb8dded5142439d8a97e338a49cb104"
                      title="Platform Walkthrough"
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />

                    {/* Floating Emojis over Scrubber Bar */}
                    <div className="absolute bottom-3 left-4 z-10 text-base pointer-events-none">❤️🔥</div>
                    <div className="absolute bottom-3 left-[45%] z-10 text-xl pointer-events-none">🔥🔥</div>
                    <div className="absolute bottom-3 right-6 z-10 flex items-center justify-center h-5 w-5 rounded bg-[#2e2e38] text-[10px] font-bold text-white border border-[#444452] pointer-events-none">
                      3
                    </div>
                  </div>

                  {/* Loom Bottom Reaction Bar */}
                  <div className="flex items-center justify-between px-5 py-3 bg-[#1c1c22] border-t border-[#2e2e38]">
                    <button className="text-zinc-500 dark:text-[#9B9085] hover:text-white transition">
                      <span className="text-sm">▼</span>
                    </button>

                    {/* Emoji Reactions Row */}
                    <div className="flex items-center gap-3 text-lg">
                      <button className="hover:scale-125 transition">❤️</button>
                      <button className="hover:scale-125 transition">👍</button>
                      <button className="hover:scale-125 transition">🔥</button>
                      <button className="hover:scale-125 transition">👏</button>
                      <button className="hover:scale-125 transition">🙌</button>
                      <button className="hover:scale-125 transition">👀</button>
                      <button className="text-xs text-zinc-500 dark:text-[#9B9085] hover:text-white font-bold bg-[#282832] p-1.5 rounded-lg border border-[#3f3f4c]">
                        +😃
                      </button>
                    </div>

                    {/* Comment Button */}
                    <button className="flex items-center gap-1.5 rounded-xl border border-[#3f3f4c] bg-[#222228] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2e2e38] transition cursor-pointer">
                      <span>+</span>
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Account settings" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: IDENTITY AND SECURITY */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Settings className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">IDENTITY AND SECURITY</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">What can I change in Account settings?</h2>
                    </div>
                  </div>
                </div>

                {/* 4 Column Cards: Profile, Security, Instant Alerts, Usage & Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Profile & Identity Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Profile & Identity</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Update your account display name, upload or remove your profile photo avatar, and view your registered email address.
                    </p>
                  </div>

                  {/* Security & Password Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Security & Password</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Update your account password by confirming your current password and choosing a new password with at least 8 characters.
                    </p>
                  </div>

                  {/* Instant Lead Alerts Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Instant Lead Alerts</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Enable real-time email notifications for new subscriber signups, configure target notification inboxes, and send test alerts.
                    </p>
                  </div>

                  {/* Usage & Limits Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Usage & Limits</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Monitor your active account plan metrics in real-time, including total leads captured, media file storage, and email sequence capacity.
                    </p>
                  </div>
                </div>

                {/* Reddish Notice Card: Account deletion is permanent */}
                <div className="rounded-2xl border border-red-200 bg-red-50/80 dark:border-[#452b23] dark:bg-[#221a18] px-5 py-4 text-left space-y-1.5 shadow-xs">
                  <h4 className="text-sm font-bold text-red-700 dark:text-[#f87171]">Account deletion is permanent</h4>
                  <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                    Deleting the account removes its lead magnets, signups, integrations, and attached custom domains. There is no recovery. LeadMagnets asks for your password and the word DELETE before it can continue.
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 text-left">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open Account settings</span>
                    <span className="text-base font-bold">→</span>
                  </Link>
                </div>
              </div>
            ) : selectedTopic === "Analytics and A/B tests" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: MEASURE RESULTS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <BarChart3 className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">MEASURE RESULTS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do analytics and A/B tests work?</h2>
                    </div>
                  </div>
                </div>

                {/* 2 Column Cards: Analytics vs A/B testing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Analytics Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-3 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Analytics</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Open a lead magnet and choose Analytics to see total signups, unique people, tracked visits and conversions, conversion rate, engagement, and results from the after-signup experience. Total signups include repeat requests. Conversion rate uses only signups matched to a tracked visit.
                    </p>
                  </div>

                  {/* A/B testing Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-3 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">A/B testing</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Test a different title or image against the current page. LeadMagnets splits new visitors between the versions and keeps each visitor on the same version.
                    </p>
                  </div>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Create a second version</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open the landing-page editor and find Test title and image.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Start the comparison</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Change the title, image, or both, then start the test.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Watch the results</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Review each version's visits and conversion rate in Analytics.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Use the winner</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        After 7 days, once every version has at least 25 visitors, LeadMagnets selects by conversion rate and applies the winner automatically.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/leadmagnets"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Lead magnets</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Manage leads" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: LEAD MANAGEMENT */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Users className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">LEAD MANAGEMENT</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I manage leads?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    The Leads area contains everyone who has requested one of your lead magnets.
                  </p>
                </div>

                {/* 2x2 Grid of 4 Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Review */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Review</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      See which lead magnet someone requested and the status of their follow-up sequence.
                    </p>
                  </div>

                  {/* Add or import */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Add or import</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Add one person manually or import up to 5,000 rows from a CSV file.
                    </p>
                  </div>

                  {/* Export */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Export</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Download the current lead list as a CSV file.
                    </p>
                  </div>

                  {/* Control follow-up */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Control follow-up</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Start a missing sequence or stop an active sequence for an individual lead.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 text-left">
                  <Link
                    href="/dashboard/leads"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open Leads</span>
                    <span className="text-base font-bold">→</span>
                  </Link>
                </div>
              </div>
            ) : selectedTopic === "Connect a calendar" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: SEQUENCE CONTROLS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Calendar className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">SEQUENCE CONTROLS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect a calendar?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Stop sending sales follow-up after a lead has already booked. LeadMagnets can stop an eligible sequence when the booking email matches the signup and that lead magnet has the option enabled. Your sender setup must be ready first.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Open Calendar settings</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Workspace setup, Optional connections, then Calendar.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add the provider credential</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        For Calendly, create a personal access token under Integrations, API and Webhooks. For Cal.com, create an API key.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Finish the connection</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Connect the account. Calendly requires a paid plan that supports webhooks. LeadMagnets configures the booking webhook for you.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Enable it per lead magnet</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        In each lead magnet's Sequence tab, turn on the option to stop the sequence when a booking is received.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Calendar connection</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Connect Zapier" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: AUTOMATIONS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <svg className="h-5.5 w-5.5 fill-[#0066B2] dark:fill-[#38BDF8]" viewBox="0 0 24 24">
                        <path d="M12 2a4 4 0 0 0-4 4v3.5a.5.5 0 0 0 .5.5H12a4 4 0 0 0 4-4V2z" />
                        <path d="M2 16a4 4 0 0 0 4 4h3.5a.5.5 0 0 0 .5-.5V16a4 4 0 0 0-4-4H2z" />
                        <path d="M16 22a4 4 0 0 0 4-4v-3.5a.5.5 0 0 0-.5-.5H16a4 4 0 0 0-4 4V22z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">AUTOMATIONS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect Zapier?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Use each signup to start another workflow, such as adding a database row, creating a task, or notifying another tool.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Create the trigger</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Create a Zap and choose Webhooks by Zapier as the trigger.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Copy the Catch Hook URL</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose Catch Hook, open the Test tab, then copy the unique webhook URL.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add it to LeadMagnets</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Workspace setup, Optional connections, then Zapier. Paste the URL into LeadMagnets.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Test and map the fields</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose Send test in LeadMagnets. Return to Zapier, choose Test trigger, then map the sample fields into your next action.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Zapier connection</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Connect Kit" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: AUDIENCE SYNC */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Mail className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">AUDIENCE SYNC</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect Kit?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Add each new signup to Kit automatically and tag them with the lead magnet they requested. Open Workspace setup, expand Optional connections, then open Kit under Automations.
                  </p>
                </div>

                {/* 3 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Start the connection</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose Connect Kit. LeadMagnets sends you to Kit's secure authorization screen.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Approve in Kit</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Sign in to Kit if needed, choose the account, and approve access.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Check the connection</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Return to LeadMagnets and confirm that the connected account name is shown.
                      </p>
                    </div>
                  </div>

                  {/* Dark Info Box */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 text-left shadow-xs">
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      New signups are added or updated by email and receive a tag identifying the lead magnet they requested.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Kit connection</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Connect Pipedrive" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: CRM SYNC */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <LinkIcon className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">CRM SYNC</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect Pipedrive?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Keep new contacts in your CRM without entering the same name and email by hand.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Find your API token</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        In Pipedrive, open Personal preferences, then API.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Copy the token safely</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Copy the token. Treat it like a password and do not share it anywhere else.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add it to LeadMagnets</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        In LeadMagnets, open Workspace setup, Optional connections, then Pipedrive. Paste the token.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Test the connection</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose Test connection and wait for the connected confirmation.
                      </p>
                    </div>
                  </div>

                  {/* Dark Info Box */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 text-left shadow-xs">
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      Each signup creates or updates a Pipedrive person. Existing people are matched by email.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Pipedrive connection</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Connect Slack" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: SIGNUP NOTIFICATIONS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Slack className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">SIGNUP NOTIFICATIONS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect Slack?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Send a useful signup alert to the right channel so your team can see interest as it happens.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Create an incoming webhook</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Create a Slack app, turn on Incoming Webhooks, then choose Add New Webhook to Workspace.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Copy the webhook URL</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose the channel, authorise the app, and copy the hooks.slack.com URL. Treat this URL like a password.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Paste it into LeadMagnets</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        In LeadMagnets, open Workspace setup, Optional connections, then Slack. Paste the URL into the webhook field.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Test the connection</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose Send test and confirm the message arrives in the selected channel.
                      </p>
                    </div>
                  </div>

                  {/* Dark Info Box */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 text-left shadow-xs">
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      Slack receives the signup name, email, lead magnet title, and public page link.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Slack connection</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Substack and Kit" || selectedTopic === "Manage leads" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: AUDIENCE SYNC */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Share2 className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">AUDIENCE SYNC</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I connect Substack or Kit (100% Free)?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Send new signups straight to the free newsletter or audience tool you already use. Open Workspace setup, expand Optional connections, then configure Substack or Kit.
                  </p>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Every signup remains saved in LeadMagnets. Make it clear on the signup page if requesting the resource also adds someone to your newsletter.
                  </p>
                </div>

                {/* Substack Card */}
                <div className="pt-1">
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-3.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Substack (100% Free)</h4>
                    <ol className="space-y-3 text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      <li>
                        <strong className="text-zinc-900 dark:text-white font-bold">1.</strong> Find your publication subdomain.
                      </li>
                      <li>
                        <strong className="text-zinc-900 dark:text-white font-bold">2.</strong> Enter only the first part, such as myletter.
                      </li>
                      <li>
                        <strong className="text-zinc-900 dark:text-white font-bold">3.</strong> Do not enter myletter.substack.com.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Disclaimer Text */}
                <p className="text-xs text-[#71717a] leading-relaxed pt-1 text-left">
                  Substack does not provide a documented public subscriber API for this connection. It uses Substack's public signup flow and may stop working if that flow changes.
                </p>

                {/* Bottom Action Button */}
                <div className="pt-2 text-left">
                  <Link
                    href="/dashboard/integration#connections-section"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open newsletter connections</span>
                    <span className="text-base font-bold">→</span>
                  </Link>
                </div>
              </div>
            ) : selectedTopic === "Legal links" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: PUBLIC PAGE FOOTER */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <BookOpen className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">PUBLIC PAGE FOOTER</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I add legal links?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Add links to your own privacy policy and terms so visitors can understand how your business handles their information and the rules that apply to your offer.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Open the legal settings</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Workspace setup and expand Legal links.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add your privacy policy</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Paste the full public URL for your privacy policy, beginning with https://.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add your terms</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add a full public URL for your terms if you use them.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Check the public page</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open a page preview and check both links. They open in a new tab from every public lead magnet footer.
                      </p>
                    </div>
                  </div>

                  {/* Dark Yellowish-Brown Warning Card: LeadMagnets does not write these policies for you */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-[#4d4022] dark:bg-[#221e16] p-5 text-left space-y-1.5 shadow-xs">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-[#fbbf24]">LeadMagnets does not write these policies for you</h4>
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      The right wording depends on your business, location, audience, and the services you use. Get appropriate legal advice if you are unsure what your policies need to cover. Leaving a field blank hides that custom link.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/integration"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Legal links</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Send from my email" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: EMAIL DELIVERY */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Mail className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">EMAIL DELIVERY</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I send from my own email?</h2>
                    </div>
                  </div>
                </div>

                {/* Dark Reddish-Chocolate Notice Card: This is optional */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#221a18] px-5 py-4 space-y-1.5 text-left shadow-xs">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    This is optional
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                    If LeadMagnets sending is already connected, you can publish and deliver a resource without setting up your own sender domain. Using a recognisable From address can make the email feel more consistent with your brand.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-1 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add your domain</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        In Workspace setup, add the root domain you own. You do not have to publish your pages on that domain.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Choose the From address</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Optional connections, then Your sender domain. Choose a sending subdomain and the address you want people to see.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add the sending records</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add the exact DNS records shown by LeadMagnets wherever your domain's DNS is managed.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Verify the sender</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Return to LeadMagnets and run the verification check. Use the address only after it shows as verified.
                      </p>
                    </div>
                  </div>

                  {/* Dark Info Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 text-left shadow-xs">
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      LeadMagnets uses a sending subdomain so its email reputation is separated from your main website. Copy every DNS record exactly as shown. Verification is often quick, but DNS changes can take up to 72 hours to appear.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-1 text-left">
                    <Link
                      href="/dashboard/integration"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open email setup</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Custom domains" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: OPTIONAL SETUP */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Globe className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">OPTIONAL SETUP</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Use your own domain</h2>
                    </div>
                  </div>
                </div>

                {/* Dark Reddish-Chocolate Top Notice Card: You can skip this completely */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#221a18] px-5 py-4 space-y-1.5 text-left shadow-xs">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    You can skip this completely.
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                    Every published lead magnet can use its included leadmagnets.so link. A custom domain gives you a recognisable branded address, but it is not required to create, publish, deliver, or collect signups.
                  </p>
                </div>

                {/* 3 Numbered Steps */}
                <div className="pt-1 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Choose your address</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Use the root domain you already own, such as example.com, then choose a page subdomain such as get.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Prove you own the domain</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        LeadMagnets gives you a TXT record. Add it wherever your DNS is managed, then click Check ownership.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Point the subdomain to LeadMagnets</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add the CNAME record shown in LeadMagnets and connect the subdomain. DNS changes can take a little while to appear.
                      </p>
                    </div>
                  </div>

                  {/* Divider & Bottom Action Button */}
                  <div className="pt-4 border-t border-[#2e2e38]">
                    <Link
                      href="/dashboard/integration"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open custom-domain setup</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Integration" || selectedTopic === "Workspace setup" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: YOUR ACCOUNT FOUNDATIONS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Settings className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">YOUR ACCOUNT FOUNDATIONS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">What belongs in Integration?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Integration controls where your pages live, where emails come from, and which other tools receive new signups. You do not need to connect every option before creating a lead magnet.
                  </p>
                </div>

                {/* 5 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* LeadMagnets URL */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">LeadMagnets URL</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Choose the included leadmagnets.so address used by your published pages.
                    </p>
                  </div>

                  {/* Custom domain */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Custom domain</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Optionally use a branded page address on a domain you own.
                    </p>
                  </div>

                  {/* Email and scheduling */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Email and scheduling</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Optionally use your own sender domain or stop a sequence when someone books.
                    </p>
                  </div>

                  {/* Connections */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Connections</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Optionally send signups to a newsletter, Slack, Zapier, Kit, or Pipedrive.
                    </p>
                  </div>

                  {/* Legal links */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Legal links</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Add your privacy policy and terms to the footer of every public lead magnet page.
                    </p>
                  </div>
                </div>

                {/* Warm Reddish-Chocolate Tip Card */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#221a18] px-5 py-4 text-left shadow-xs">
                  <p className="text-sm text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                    Start with your LeadMagnets URL. Add a custom domain and integrations only when they support the way you want to publish, deliver, or follow up.
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-1 text-left">
                  <Link
                    href="/dashboard/integration"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open Integration</span>
                    <span className="text-base font-bold">→</span>
                  </Link>
                </div>
              </div>
            ) : selectedTopic === "Delivery emails" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: DELIVER THE PROMISE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Send className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">DELIVER THE PROMISE</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do delivery emails work?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    The delivery email is sent immediately after a successful signup. It should make the promised resource easy to find and remind the reader why it is useful.
                  </p>
                </div>

                {/* Warm Reddish-Brown Tinted Card: Bring your own resource link */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#221a18] px-5 py-4 space-y-1.5 text-left shadow-xs">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white text-left">
                    Bring your own resource link
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-[#9B9085] leading-relaxed text-left">
                    Create the resource yourself, then paste its full download or access link into this email. For files, you can upload the resource under Hosted resources and use the unique link LeadMagnets gives you.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Open the email editor</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open a lead magnet and choose the Delivery email tab.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Set the inbox details</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Write a clear subject and preview line so the reader recognises what they requested.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Make access obvious</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add a short welcome and a prominent link to the promised file or resource.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Preview before sending</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Use Preview to check the exact email before publishing the lead magnet.
                      </p>
                    </div>
                  </div>

                  {/* Dark Info Card: Delivery content and sender setup are different */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 space-y-1.5 shadow-xs">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Delivery content and sender setup are different</h4>
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      The Delivery email tab controls what the email says. Your sender setup controls the From name and address. You can edit the email without connecting your own sender domain.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Link
                      href="/dashboard/leadmagnets"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Lead magnets</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Follow-up sequences" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: CONTINUE THE CONVERSATION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <GitFork className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">CONTINUE THE CONVERSATION</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do follow-up sequences work?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    A follow-up sequence is an optional set of emails sent after the resource. Use it to help someone apply what they downloaded, answer the next question, and introduce a relevant next step.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Turn on follow-up</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open the Sequence tab and enable the sequence. Sending must be ready on the account first.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Build the sequence</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add up to 10 emails. Give each one a focused subject, preview line, and message.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Set the timing</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose the delay before each email. The first delay starts at signup, and later delays start after the previous email.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Stop when someone books</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        If Calendly or Cal.com is connected, you can stop this magnet's sequence when the same email books a call.
                      </p>
                    </div>
                  </div>

                  {/* Notice Card */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 space-y-1.5 shadow-xs text-left">
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      Keep the sequence connected to the resource they requested. Useful follow-up builds trust; unrelated promotion gives people a reason to unsubscribe.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Link
                      href="/dashboard/leadmagnets"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Lead magnets</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Brand colours and logo" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: PAGE APPEARANCE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Palette className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">PAGE APPEARANCE</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I update my brand colours?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Brand settings apply to every public lead magnet and to the editor preview.
                  </p>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Open your brand settings</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Brand from the dashboard sidebar.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Set the identity and colour</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Add your business name, upload a logo, and choose the primary colour used across your pages.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Choose the page style</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Choose light or dark page appearance and adjust the highlight intensity.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Preview and save</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Check the preview, then choose Save brand.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Link
                      href="/dashboard/templates"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Brand settings</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "After-signup experience" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: WHAT HAPPENS NEXT */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Calendar className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">WHAT HAPPENS NEXT</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I set up the after signup experience?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Control what someone sees on screen immediately after filling out your lead magnet form.
                  </p>
                </div>

                {/* 3 Options Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Standard confirmation</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Show a clean on-page thank you message confirming their signup.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Send them elsewhere</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Redirect signups directly to your main website, booking page, or custom URL.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-1.5 text-left">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Custom next step</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Present a specific call to action or immediate download link right after signup.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2">
                  <Link
                    href="/dashboard/leadmagnets"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open Lead magnets</span>
                    <span className="text-base font-bold">→</span>
                  </Link>
                </div>
              </div>
            ) : selectedTopic === "Assets" || selectedTopic === "Hosted resources" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: FILES AND DOWNLOADS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <FolderOpen className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">FILES AND DOWNLOADS</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I host a resource?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Hosted resources give you a stable download link for a PDF, image, ZIP file, or other supported resource. The file is private in storage. Only someone with its unique link can download it.
                  </p>
                </div>

                {/* 3 Numbered Steps */}
                <div className="pt-2 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Upload the file</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open Assets from the sidebar and choose Upload resource.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Name the resource</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Give it a clear name. This is the name shown in your resource library.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add it to the Delivery email</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Copy its unique link, then paste it into the Delivery email for the lead magnet that should send it.
                      </p>
                    </div>
                  </div>

                  {/* Dark Warning Card: Deleting a resource revokes its link */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#1c1c22] p-5 space-y-1.5 shadow-xs">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Deleting a resource revokes its link</h4>
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                      Anyone using the old link will lose access immediately, so update any lead magnets that still use it.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Link
                      href="/dashboard/assets"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Assets</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Edit and publish a magnet" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                {/* Header: BUILD THE FULL JOURNEY */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">BUILD THE FULL JOURNEY</p>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">How do I edit and publish a lead magnet?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                    Each lead magnet has one editor for the page people visit, the email that delivers the resource, any follow-up emails, and what happens after signup. Changes save automatically while you work.
                  </p>
                </div>

                {/* 2x2 Grid of 4 Editor Component Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Landing page */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Landing page</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Write the promise, explain the value, add an image, and choose the details the form should collect.
                    </p>
                  </div>

                  {/* Delivery email */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Delivery email</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Set the subject, preview text, and message that sends the promised resource.
                    </p>
                  </div>

                  {/* Sequence */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Sequence</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Add optional follow-up emails and choose the delay before each one.
                    </p>
                  </div>

                  {/* After signup */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">After signup</h4>
                    <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Show a confirmation, redirect to another URL, or create a custom next-step page.
                    </p>
                  </div>
                </div>

                {/* 4 Numbered Steps */}
                <div className="pt-3 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Preview the experience</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Use Preview to check the real page or email before sharing it.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Get help with the copy</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Use AI Autofill for copy ideas or revisions, then review the changes before applying them.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Publish when ready</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Change the status to Published when the page is ready. Draft pages are not available to visitors.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Share the page</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Copy the public link or download its QR code from the page actions, then share it with your audience.
                      </p>
                    </div>
                  </div>

                  {/* Dark Red Warning Card */}
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 dark:border-[#4d2226] dark:bg-[#221617] p-5 shadow-xs">
                    <p className="text-xs text-red-700 dark:text-[#f87171] leading-relaxed">
                      Deleting a lead magnet removes its public page and cannot be undone. Signups already collected remain in your Leads area.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Link
                      href="/dashboard/leadmagnets"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Lead magnets</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "Create your first lead magnet" ? (
              <div className="max-w-[43rem] mx-auto space-y-4 py-2">
                {/* Top Card: Build a direct path from interest to your email list */}
                <div className="rounded-2xl border border-[#0066B2]/40 bg-[#18181c] bg-[radial-gradient(ellipse_160%_200%_at_left_center,#0B2545_0%,#132A4A_28%,#161F2B_55%,#18181c_100%)] p-6 space-y-4 shadow-sm">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/40 bg-[#0066B2]/15 px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#38BDF8] uppercase">
                    <Rocket className="h-3.5 w-3.5 text-[#38BDF8]" />
                    <span>YOUR FIRST LAUNCH</span>
                  </div>

                  <h2 className="text-xl font-bold text-white leading-tight">
                    Build a direct path from interest to your email list
                  </h2>

                  <p className="text-sm text-white/85 leading-relaxed">
                    LeadMagnets builds the signup, delivery, and follow-up journey. You create the actual resource people receive, then add its download or access link to the Delivery email.
                  </p>
                </div>

                {/* Bottom Card: Create the resource before you publish */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/35 dark:bg-[#201816] p-6 space-y-2.5 shadow-xs">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Create the resource before you publish
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-[#9B9085] leading-relaxed">
                    Make the PDF, template, video, email course, AI tool, or other useful resource yourself. LeadMagnets does not generate the finished resource for you. It gives that resource a page, captures the signup, emails the link, and manages what happens next.
                  </p>
                </div>

                {/* 4-Step Action Steps Section */}
                <div className="pt-3 space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Create the actual resource</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Pick one small problem and make the PDF, template, video, course, tool, or other resource that solves it.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Get an accessible link</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Upload a file under Hosted resources and copy its unique link, or use a public share link from wherever the resource is hosted.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Paste the link into the Delivery email</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Open the Delivery email tab and add a prominent linked button or line of text so subscribers can open or download the resource.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Complete and publish the journey</h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Finish the Landing page, optional Sequence, and After signup tabs. Preview everything, publish the page, and share its public link.
                      </p>
                    </div>
                  </div>

                  {/* Divider & Action Buttons */}
                  <div className="pt-5 border-t border-[#2e2e38] flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowHelp(false);
                        setShowCreateMagnetModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Create a lead magnet</span>
                      <span className="text-base font-bold">→</span>
                    </button>

                    <Link
                      href="/dashboard/integration"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center rounded-xl border border-[#2e2e38] bg-[#222228] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2c2c34] transition-all cursor-pointer"
                    >
                      Set up a custom domain
                    </Link>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "What works best?" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                    <Sparkles className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">QUALITY BEATS SIZE</p>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">What lead magnets work best?</h2>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                  There is no single format that wins for every audience. The strongest option is the one that solves one specific problem, is easy to use, and naturally connects to what you help people do next. A concise checklist can be more valuable than a long ebook if it gets someone to a result.
                </p>

                {/* 2-column Grid of Lead Magnet Format Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Checklist */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Checklist</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      A repeatable process with clear steps
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> The 12-point landing-page launch checklist
                    </div>
                  </div>

                  {/* Template */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Template</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Saving someone time on a task they already do
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> A client onboarding email template pack
                    </div>
                  </div>

                  {/* Short guide */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Short guide</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Explaining a narrow problem or decision
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> A practical guide to pricing your first workshop
                    </div>
                  </div>

                  {/* Scorecard or quiz */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Scorecard or quiz</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Helping someone understand their current position
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> How ready is your business to hire?
                    </div>
                  </div>

                  {/* Swipe file */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Swipe file</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Giving proven examples people can adapt
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> 25 welcome-email subject lines
                    </div>
                  </div>

                  {/* Calculator */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Calculator</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Turning complicated inputs into a useful answer
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> Your freelance day-rate calculator
                    </div>
                  </div>

                  {/* Interactive AI artefact */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Interactive AI artefact</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Creating a useful personalised result from someone's answers
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> A positioning statement or campaign brief generator
                    </div>
                  </div>

                  {/* Five-day email course */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                      <FileText className="h-4 w-4" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Five-day email course</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Teaching a practical process in small, useful daily steps
                    </p>
                    <div className="rounded-xl bg-[#EFF6FF]/60 border border-[#0066B2]/20 text-zinc-700 dark:bg-[#222227] dark:border-[#0066B2]/30 dark:text-[#d4c8bc] p-2.5 text-xs font-medium">
                      <span className="font-semibold text-zinc-900 dark:text-white">Example:</span> Build your first client referral system in five days
                    </div>
                  </div>
                </div>

                {/* Dark Green Banner: A strong idea should pass four checks */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-[#22543d] dark:bg-[#122e20] p-5 space-y-3 shadow-xs">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-[#6ee7b7]">A strong idea should pass four checks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-emerald-700 dark:text-[#6ee7b7]">
                    <p>One clear audience and problem</p>
                    <p>A specific, benefit-led title</p>
                    <p>A result they can use quickly</p>
                    <p>A natural link to your paid offer</p>
                  </div>
                </div>

                {/* Bottom 2 Advice Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Make an AI artefact genuinely useful */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Make an AI artefact genuinely useful</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Ask only for the information needed to create a specific output. Give the visitor something they can use immediately, not a generic block of generated text.
                    </p>
                  </div>

                  {/* Build trust before making the offer */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 space-y-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Build trust before making the offer</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      In a five-day course, deliver one clear win each day. On the final day, introduce a relevant paid next step that helps the reader continue the progress they have already made.
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedTopic === "How do they work?" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                    <Sliders className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">FROM VISITOR TO SUBSCRIBER</p>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">How do lead magnets work?</h2>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                  The resource, page, delivery, and follow-up work together as one simple flow.
                </p>

                {/* 6-step flow */}
                <div className="space-y-5 pt-1">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Make the resource</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        Create the actual PDF, template, video, course, tool, or other resource people will receive.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Add it to the journey</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        Give the resource an accessible link and paste that link into the Delivery email in LeadMagnets.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Promote the page</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        Publish the page and share its link in the places your audience already pays attention.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">They sign up</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        A visitor sees the promise and enters their details to request the resource.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      5
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">They get the promised value</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        LeadMagnets emails the resource link immediately and records the signup for you.
                      </p>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#0066B2]/30 text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] text-xs font-semibold mt-0.5">
                      6
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Continue the conversation</h4>
                      <p className="text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-0.5">
                        Relevant follow-up can help them use the resource, answer the next question, or introduce your offer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Tip Card */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-4 text-sm text-zinc-500 dark:text-[#9B9085] leading-relaxed mt-4">
                  Publishing is only the start. Put the link in your website, social profiles, posts, newsletter, podcast notes, or anywhere else the right people already find you.
                </div>
              </div>
            ) : selectedTopic === "Why use a lead magnet?" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                    <CheckCircle2 className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">GIVE VALUE FIRST</p>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Why use a lead magnet?</h2>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                  Most people will not buy or book the first time they find you. A lead magnet asks for a much smaller commitment, so useful attention does not have to disappear when they leave the page.
                </p>

                {/* 2x2 Grid of Benefit Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Capture interest */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#34d399]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Capture interest</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Give someone a reason to join your audience before they are ready to buy.
                    </p>
                  </div>

                  {/* Attract better-fit leads */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#34d399]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Attract better-fit leads</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      A focused resource appeals to people who already care about the problem you solve.
                    </p>
                  </div>

                  {/* Prove your expertise */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#34d399]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Prove your expertise</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      A genuinely useful result lets people experience the quality of your thinking.
                    </p>
                  </div>

                  {/* Create an automatic next step */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-3.5 sm:p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#34d399]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Create an automatic next step</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                      Deliver the resource immediately, then send relevant follow-up without doing it by hand.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed pt-1">
                  The subject of the resource also tells you something useful about intent. Someone who requests a pricing template, for example, has shown you the problem they are trying to solve.
                </p>
              </div>
            ) : selectedTopic === "What is a lead magnet?" ? (
              <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                    <Gift className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">THE SIMPLE DEFINITION</p>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">What is a lead magnet?</h2>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-[#d4c8bc] leading-relaxed">
                  A lead magnet is a useful resource or experience offered in exchange for contact information, usually an email address. It gives a potential customer a quick win around a problem you solve, and gives you a relevant reason to follow up with them.
                </p>

                <div className="rounded-2xl border border-[#0066B2]/30 bg-white text-zinc-900 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:text-white p-5 space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Think of it as a useful preview</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                    A bookkeeper might offer a month-end checklist. The checklist solves a real problem now, demonstrates how the bookkeeper can help, and creates a natural path to a future conversation about managing the reader's finances.
                  </p>
                </div>
              </div>
            ) : selectedTopic ? (
              <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
                <h3 className="text-xl font-bold text-white">{selectedTopic}</h3>
                <p className="text-sm text-zinc-500 dark:text-[#9B9085]">Detailed guide and steps for this topic will be available here soon.</p>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#222227] px-4 py-2 text-xs font-semibold text-white border border-[#2e2e38] hover:bg-[#282830] transition-colors"
                >
                  Back to topics
                </button>
              </div>
            ) : (
              <>
                {/* What do you need help with? Title */}
                {!searchQuery && (
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">What do you need help with?</h2>
                    <p className="text-xs text-zinc-700 dark:text-[#9B9085] mt-1">Choose a topic for a clear answer and the exact steps to follow.</p>
                  </div>
                )}

                {/* Modal Search Bar */}
                <div className="relative flex items-center rounded-xl border border-[#E5E3DD] bg-white dark:border-[#0066B2]/30 dark:bg-[#141417] px-3.5 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] mb-2 transition-colors shadow-sm dark:shadow-none">
                  <Search className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search topics, integrations, or setup"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder-[#71717a] focus:ring-0"
                  />
                </div>

                {searchQuery ? (
                  <div>
                    <p className="text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase tracking-wider mb-3">Search Results</p>
                    {filteredTopics.length === 0 ? (
                      <p className="text-xs text-[#9B9085] py-6 text-center">No topics match your search query.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {filteredTopics.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => setSelectedTopic(topic.text)}
                            className="flex items-center justify-between rounded-lg bg-[#222227] border border-[#0066B2]/30 hover:border-[#0066B2] p-3.5 text-left text-xs font-semibold text-white transition-colors"
                          >
                            <span className="text-xs font-semibold text-white">{topic.text}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                    {/* Left Column (LEARN, SET UP, MANAGE) */}
                    <div className="space-y-3.5">
                      {/* LEARN */}
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#18181C] p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0066B2]/80 dark:text-[#38BDF8]/80 uppercase tracking-wider mb-3">
                          <span>{helpTopics.learn.title}</span>
                          <span>{helpTopics.learn.count}</span>
                        </div>
                        <div className="space-y-2">
                          {helpTopics.learn.items.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] dark:bg-[#121214] dark:border-[#0066B2]/30 dark:hover:bg-[#0066B2]/15 dark:hover:border-[#0066B2]/60 p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-white transition-all shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F8] border border-[#E2E8F0] text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] group-hover:bg-[#0066B2] group-hover:border-[#0066B2] group-hover:text-white transition-all">
                                  {topic.icon === "BookOpen" && <BookOpen className="h-3.5 w-3.5" />}
                                  {topic.icon === "Gift" && <Gift className="h-3.5 w-3.5" />}
                                  {topic.icon === "Sliders" && <Sliders className="h-3.5 w-3.5" />}
                                  {topic.icon === "Lightbulb" && <Lightbulb className="h-3.5 w-3.5" />}
                                </span>
                                <span>{topic.text}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SET UP */}
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#18181C] p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0066B2]/80 dark:text-[#38BDF8]/80 uppercase tracking-wider mb-3">
                          <span>{helpTopics.setup.title}</span>
                          <span>{helpTopics.setup.count}</span>
                        </div>
                        <div className="space-y-2">
                          {helpTopics.setup.items.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] dark:bg-[#121214] dark:border-[#0066B2]/30 dark:hover:bg-[#0066B2]/15 dark:hover:border-[#0066B2]/60 p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-white transition-all shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F8] border border-[#E2E8F0] text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] group-hover:bg-[#0066B2] group-hover:border-[#0066B2] group-hover:text-white transition-all">
                                  {topic.icon === "Settings" && <Settings className="h-3.5 w-3.5" />}
                                  {topic.icon === "Globe" && <Globe className="h-3.5 w-3.5" />}
                                  {topic.icon === "Mail" && <Mail className="h-3.5 w-3.5" />}
                                  {topic.icon === "BookOpen" && <BookOpen className="h-3.5 w-3.5" />}
                                </span>
                                <span>{topic.text}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* MANAGE */}
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#18181C] p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0066B2]/80 dark:text-[#38BDF8]/80 uppercase tracking-wider mb-3">
                          <span>{helpTopics.manage.title}</span>
                          <span>{helpTopics.manage.count}</span>
                        </div>
                        <div className="space-y-2">
                          {helpTopics.manage.items.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] dark:bg-[#121214] dark:border-[#0066B2]/30 dark:hover:bg-[#0066B2]/15 dark:hover:border-[#0066B2]/60 p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-white transition-all shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F8] border border-[#E2E8F0] text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] group-hover:bg-[#0066B2] group-hover:border-[#0066B2] group-hover:text-white transition-all">
                                  {topic.icon === "Users" && <Users className="h-3.5 w-3.5" />}
                                  {topic.icon === "BarChart3" && <BarChart3 className="h-3.5 w-3.5" />}
                                  {topic.icon === "User" && <User className="h-3.5 w-3.5" />}
                                  {topic.icon === "PlayCircle" && <PlayCircle className="h-3.5 w-3.5" />}
                                </span>
                                <span>{topic.text}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (BUILD, CONNECTIONS) */}
                    <div className="space-y-3.5">
                      {/* BUILD */}
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#18181C] p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0066B2]/80 dark:text-[#38BDF8]/80 uppercase tracking-wider mb-3">
                          <span>{helpTopics.build.title}</span>
                          <span>{helpTopics.build.count}</span>
                        </div>
                        <div className="space-y-2">
                          {helpTopics.build.items.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] dark:bg-[#121214] dark:border-[#0066B2]/30 dark:hover:bg-[#0066B2]/15 dark:hover:border-[#0066B2]/60 p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-white transition-all shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F8] border border-[#E2E8F0] text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] group-hover:bg-[#0066B2] group-hover:border-[#0066B2] group-hover:text-white transition-all">
                                  {topic.icon === "Compass" && <Compass className="h-3.5 w-3.5" />}
                                  {topic.icon === "FileText" && <FileText className="h-3.5 w-3.5" />}
                                  {topic.icon === "FolderOpen" && <FolderOpen className="h-3.5 w-3.5" />}
                                  {topic.icon === "Palette" && <Palette className="h-3.5 w-3.5" />}
                                  {topic.icon === "Send" && <Send className="h-3.5 w-3.5" />}
                                  {topic.icon === "GitFork" && <GitFork className="h-3.5 w-3.5" />}
                                  {topic.icon === "Calendar" && <Calendar className="h-3.5 w-3.5" />}
                                </span>
                                <span>{topic.text}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CONNECTIONS */}
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#18181C] p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0066B2]/80 dark:text-[#38BDF8]/80 uppercase tracking-wider mb-3">
                          <span>{helpTopics.connections.title}</span>
                          <span>{helpTopics.connections.count}</span>
                        </div>
                        <div className="space-y-2">
                          {helpTopics.connections.items.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] dark:bg-[#121214] dark:border-[#0066B2]/30 dark:hover:bg-[#0066B2]/15 dark:hover:border-[#0066B2]/60 p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-white transition-all shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F8] border border-[#E2E8F0] text-[#0066B2] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8] group-hover:bg-[#0066B2] group-hover:border-[#0066B2] group-hover:text-white transition-all">
                                  {topic.icon === "Share2" && <Share2 className="h-3.5 w-3.5" />}
                                  {topic.icon === "Cpu" && <Cpu className="h-3.5 w-3.5" />}
                                  {topic.icon === "Slack" && <Slack className="h-3.5 w-3.5" />}
                                  {topic.icon === "Zap" && (
                                    <svg className="h-3.5 w-3.5 fill-[#0066B2] dark:fill-[#38BDF8] group-hover:fill-white transition-all" viewBox="0 0 24 24">
                                      <path d="M12 2a4 4 0 0 0-4 4v3.5a.5.5 0 0 0 .5.5H12a4 4 0 0 0 4-4V2z" />
                                      <path d="M2 16a4 4 0 0 0 4 4h3.5a.5.5 0 0 0 .5-.5V16a4 4 0 0 0-4-4H2z" />
                                      <path d="M16 22a4 4 0 0 0 4 4v-3.5a.5.5 0 0 0-.5-.5H16a4 4 0 0 0-4 4V22z" />
                                    </svg>
                                  )}
                                  {topic.icon === "Link" && <LinkIcon className="h-3.5 w-3.5" />}
                                  {topic.icon === "Calendar" && <Calendar className="h-3.5 w-3.5" />}
                                </span>
                                <span>{topic.text}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ExpandableScreenContent>

  );
}
