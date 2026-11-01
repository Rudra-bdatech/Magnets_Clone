"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, X, Check, Target, Layers } from "lucide-react";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";

interface AIMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (data: {
    name: string;
    headline: string;
    subheadline: string;
    cta: string;
    deliverable: string;
    pitch?: string;
    bullets?: string[];
    accent: string;
    template: "classic" | "video" | "quiz";
    emails?: any[];
    imageUrl?: string;
  }) => void;
}

export default function AIMagnetModal({ isOpen, onClose, onGenerated }: AIMagnetModalProps) {
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [format, setFormat] = useState("Interactive Checklist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          targetAudience: targetAudience.trim() || "creators & founders",
          format,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate AI lead magnet");
      }

      onGenerated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl dark:border-ink-700 dark:bg-ink-900 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-ink-950 dark:text-white flex items-center gap-2">
              1-Click AI Funnel Creator
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Generate landing page copy, email sequences & deliverables instantly.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div>
            <FieldLabel>What topic or outcome is this about?</FieldLabel>
            <Input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Scaling SaaS Cold Outreach, Notion Productivity Engine"
              required
              autoFocus
            />
          </div>

          <div>
            <FieldLabel>Target Audience (Optional)</FieldLabel>
            <Input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. B2B Founders, Freelance Designers, Content Creators"
            />
          </div>

          <div>
            <FieldLabel>Funnel Format</FieldLabel>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: "Checklist", val: "Interactive Checklist" },
                { label: "Cheat Sheet", val: "Cheat Sheet PDF" },
                { label: "Video Course", val: "Gated Video Course" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setFormat(item.val)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-medium transition ${
                    format === item.val
                      ? "border-brand-orange bg-brand-soft text-brand-orange dark:bg-ink-800"
                      : "border-ink-200 bg-ink-50 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300"
                  }`}
                >
                  {item.label}
                  {format === item.val && <Check className="mt-1 h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <Button type="submit" disabled={loading || !topic.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating Magic...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate Full Funnel
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
