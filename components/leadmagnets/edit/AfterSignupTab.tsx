"use client";

import React from "react";
import { Check, ExternalLink, FileText, Plus, Trash2, GripVertical } from "lucide-react";
import { type Account, type QuizQuestion, type QuizOption } from "@/lib/data";

export interface AfterSignupTabProps {
  account: Account | null;
  afterSignupOption: "standard" | "elsewhere" | "custom";
  setAfterSignupOption: (option: "standard" | "elsewhere" | "custom") => void;
  destinationUrl: string;
  setDestinationUrl: (url: string) => void;
  customHeading: string;
  setCustomHeading: (heading: string) => void;
  customMessage: string;
  setCustomMessage: (message: string) => void;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  buttonLabel: string;
  setButtonLabel: (label: string) => void;
  buttonUrl: string;
  setButtonUrl: (url: string) => void;
  quizFunnelEnabled: boolean;
  setQuizFunnelEnabled: (enabled: boolean) => void;
  quizQuestions: QuizQuestion[];
  setQuizQuestions: (questions: QuizQuestion[]) => void;
}

function uid() {
  return Math.random().toString(36).substring(2, 9);
}

export default function AfterSignupTab({
  account,
  afterSignupOption,
  setAfterSignupOption,
  destinationUrl,
  setDestinationUrl,
  customHeading,
  setCustomHeading,
  customMessage,
  setCustomMessage,
  videoUrl,
  setVideoUrl,
  buttonLabel,
  setButtonLabel,
  buttonUrl,
  setButtonUrl,
  quizFunnelEnabled,
  setQuizFunnelEnabled,
  quizQuestions,
  setQuizQuestions,
}: AfterSignupTabProps) {
  const isDark = (account?.themeMode || "light") === "dark";

  // ── Question helpers ───────────────────────────────────────────────────────

  function addQuestion() {
    const newQ: QuizQuestion = {
      id: uid(),
      question: "",
      options: [
        { id: uid(), label: "", routeUrl: "" },
        { id: uid(), label: "", routeUrl: "" },
      ],
    };
    setQuizQuestions([...quizQuestions, newQ]);
  }

  function removeQuestion(qId: string) {
    setQuizQuestions(quizQuestions.filter((q) => q.id !== qId));
  }

  function updateQuestion(qId: string, text: string) {
    setQuizQuestions(
      quizQuestions.map((q) => (q.id === qId ? { ...q, question: text } : q))
    );
  }

  function addOption(qId: string) {
    setQuizQuestions(
      quizQuestions.map((q) =>
        q.id === qId
          ? { ...q, options: [...q.options, { id: uid(), label: "", routeUrl: "" }] }
          : q
      )
    );
  }

  function removeOption(qId: string, oId: string) {
    setQuizQuestions(
      quizQuestions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.filter((o) => o.id !== oId) }
          : q
      )
    );
  }

  function updateOption(qId: string, oId: string, field: keyof QuizOption, value: string) {
    setQuizQuestions(
      quizQuestions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === oId ? { ...o, [field]: value } : o
              ),
            }
          : q
      )
    );
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const cardBg = isDark
    ? "border-[#27272A] bg-[#18181B] text-white"
    : "border-zinc-200 bg-white text-zinc-900";

  const inputCls = `w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${
    isDark
      ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]"
      : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
  }`;

  const labelCls = `text-xs font-semibold block mb-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`;

  return (
    <div className="space-y-4">
      {/* Canvas Outer Wrapper */}
      <div
        className={`rounded-2xl border p-3 sm:p-5 transition-colors duration-200 ${
          isDark
            ? "border-[#1F1F24] bg-[#0E0E10] text-white"
            : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"
        }`}
      >
        <div className="mx-auto max-w-4xl space-y-4">

          {/* ── Top Options Card ─────────────────────────────────────────── */}
          <div className={`rounded-2xl border p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${cardBg}`}>
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-xs ${
                  isDark
                    ? "border-[#27272A] bg-[#121216] text-white"
                    : "border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                <Check className="h-4 w-4 stroke-[2.5px]" />
              </div>
              <div>
                <h3
                  className={`text-base font-extrabold ${isDark ? "text-white" : "text-zinc-900"}`}
                >
                  What happens after someone opts in?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Keep it simple: show a confirmation, take them straight to another URL, or give them a useful next step on a short page.
                </p>
              </div>
            </div>

            {/* 3 Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
              {/* Standard */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("standard")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${
                  afterSignupOption === "standard"
                    ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                    : isDark
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]"
                }`}
              >
                <h4
                  className={`text-xs sm:text-sm font-extrabold ${
                    afterSignupOption === "standard" ? "text-white" : isDark ? "text-white" : "text-zinc-900"
                  }`}
                >
                  Standard confirmation
                </h4>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    afterSignupOption === "standard" ? "text-white/90" : "text-zinc-400"
                  }`}
                >
                  Show the email confirmation message.
                </p>
              </button>

              {/* Elsewhere */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("elsewhere")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${
                  afterSignupOption === "elsewhere"
                    ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                    : isDark
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]"
                }`}
              >
                <h4
                  className={`text-xs sm:text-sm font-extrabold ${
                    afterSignupOption === "elsewhere" ? "text-white" : isDark ? "text-white" : "text-zinc-900"
                  }`}
                >
                  Send them elsewhere
                </h4>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    afterSignupOption === "elsewhere" ? "text-white/90" : "text-zinc-400"
                  }`}
                >
                  Open a URL as soon as the form is submitted.
                </p>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("custom")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${
                  afterSignupOption === "custom"
                    ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                    : isDark
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]"
                }`}
              >
                <h4
                  className={`text-xs sm:text-sm font-extrabold ${
                    afterSignupOption === "custom" ? "text-white" : isDark ? "text-white" : "text-zinc-900"
                  }`}
                >
                  Custom next step
                </h4>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    afterSignupOption === "custom" ? "text-white/90" : "text-zinc-400"
                  }`}
                >
                  Show your own message, video, or offer.
                </p>
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-medium">
              A quiz funnel is available with Custom next step.
            </p>

            {/* Dynamic: elsewhere URL */}
            {afterSignupOption === "elsewhere" && (
              <div className={`pt-3 space-y-1.5 border-t ${isDark ? "border-[#27272A]" : "border-zinc-100"}`}>
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                  <ExternalLink className="h-3.5 w-3.5 text-[#0066B2]" />
                  <span>Destination URL</span>
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://your-site.com/next-step"
                  className={inputCls}
                />
                <p className="text-xs text-zinc-400">
                  They will be taken here straight after a successful signup.
                </p>
              </div>
            )}

            {/* Dynamic: custom fields */}
            {afterSignupOption === "custom" && (
              <div className={`pt-3 space-y-3 border-t ${isDark ? "border-[#27272A]" : "border-zinc-100"}`}>
                <div>
                  <label className={labelCls}>Heading</label>
                  <input
                    type="text"
                    value={customHeading}
                    onChange={(e) => setCustomHeading(e.target.value)}
                    placeholder="You are in. Here is what to do next."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Message</label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Set expectations, introduce an offer, or explain the next step."
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none resize-none transition ${
                      isDark
                        ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold flex items-center gap-1.5 mb-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    <span>🎥 Loom or YouTube URL</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.loom.com/share/..."
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Button label</label>
                    <input
                      type="text"
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Book a call"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Button URL</label>
                    <input
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://cal.com/..."
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Quiz Funnel Card ──────────────────────────────────────────── */}
          <div className={`rounded-2xl border shadow-xs transition-colors duration-200 ${cardBg}`}>

            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDark ? "bg-[#121216] text-zinc-200" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4
                    className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-zinc-900"}`}
                  >
                    Add a quiz funnel
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                    Ask a short series of questions after signup. Save every answer, then optionally route people based on their responses.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuizFunnelEnabled(!quizFunnelEnabled)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${
                  quizFunnelEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${quizFunnelEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                <span>{quizFunnelEnabled ? "On" : "Off"}</span>
              </button>
            </div>

            {/* ── Question Builder (only when On) ──────────────────────── */}
            {quizFunnelEnabled && (
              <div className={`border-t px-4 pb-5 pt-4 space-y-4 ${isDark ? "border-[#27272A]" : "border-zinc-100"}`}>

                {quizQuestions.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-2">
                    No questions yet. Click &ldquo;Add question&rdquo; to start building your quiz.
                  </p>
                )}

                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-3 sm:p-4 space-y-3 ${
                      isDark ? "border-[#27272A] bg-[#121216]" : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    {/* Question header */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                        Q{qIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, e.target.value)}
                        placeholder="e.g. What is your biggest challenge right now?"
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none transition ${
                          isDark
                            ? "border-[#27272A] bg-[#0E0E10] text-white placeholder:text-zinc-600 focus:border-[#0066B2]"
                            : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pl-6">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold shrink-0 w-4 text-center ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => updateOption(q.id, opt.id, "label", e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition ${
                              isDark
                                ? "border-[#27272A] bg-[#0E0E10] text-white placeholder:text-zinc-600 focus:border-[#0066B2]"
                                : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
                            }`}
                          />
                          <input
                            type="url"
                            value={opt.routeUrl || ""}
                            onChange={(e) => updateOption(q.id, opt.id, "routeUrl", e.target.value)}
                            placeholder="Route URL (optional)"
                            className={`w-36 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition hidden sm:block ${
                              isDark
                                ? "border-[#27272A] bg-[#0E0E10] text-white placeholder:text-zinc-600 focus:border-[#0066B2]"
                                : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
                            }`}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, opt.id)}
                              className="shrink-0 rounded-lg p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Remove option"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      {q.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold transition cursor-pointer mt-1 ${
                            isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                          }`}
                        >
                          <Plus className="h-3 w-3" />
                          Add option
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {quizQuestions.length < 10 && (
                  <button
                    type="button"
                    onClick={addQuestion}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                      isDark
                        ? "border-[#27272A] text-zinc-300 hover:border-[#0066B2] hover:text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-[#0066B2] hover:text-zinc-900"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add question
                  </button>
                )}

                <p className="text-[11px] text-zinc-400">
                  Answers are saved to each lead record. Route URLs are optional — if set, the subscriber is redirected to that URL after answering.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
