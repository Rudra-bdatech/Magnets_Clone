"use client";

import React, { useState, useEffect, memo } from "react";
import {
  Mail, ChevronDown, Eye, EyeOff, Check, RefreshCw, Loader2, AlertCircle,
  Unlink, ExternalLink, ShieldCheck, Zap
} from "lucide-react";
import { type Account } from "@/lib/data";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface EmailSenderSectionProps {
  account: Account | null;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

const SMTP_PRESETS: Record<string, { host: string; port: number; secure: boolean; label: string }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false, label: "Gmail (App Password)" },
  outlook: { host: "smtp.office365.com", port: 587, secure: false, label: "Outlook / Office 365" },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, secure: false, label: "SendGrid" },
  resend: { host: "smtp.resend.com", port: 465, secure: true, label: "Resend" },
  zoho: { host: "smtp.zoho.com", port: 587, secure: false, label: "Zoho Mail" },
  custom: { host: "", port: 587, secure: false, label: "Custom SMTP" },
};

export const EmailSenderSection = memo(function EmailSenderSection({
  account,
  setAccount,
  addToast,
}: EmailSenderSectionProps) {
  const [showSmtp, setShowSmtp] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [preset, setPreset] = useState<string>("gmail");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnectingSmtp, setDisconnectingSmtp] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromEmail: "",
    fromName: account?.name || "",
  });

  // Handle OAuth redirect query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const gmailSuccess = url.searchParams.get("gmail");
    const gmailError = url.searchParams.get("gmailError");

    if (gmailSuccess === "connected") {
      addToast("Gmail connected successfully! 🎉", "success");
      // Fetch updated account state
      fetch("/api/account")
        .then((r) => r.json())
        .then((acc) => { if (acc && !acc.error) setAccount(acc); })
        .catch(() => {});
      url.searchParams.delete("gmail");
      window.history.replaceState({}, "", url.toString());
    } else if (gmailError) {
      addToast(`Gmail connection error: ${gmailError}`, "error");
      url.searchParams.delete("gmailError");
      window.history.replaceState({}, "", url.toString());
    }
  }, [addToast, setAccount]);

  // Pre-fill form if account already has custom SMTP
  useEffect(() => {
    if (account?.customSmtp?.isVerified) {
      setSmtpForm((f) => ({
        ...f,
        host: account.customSmtp!.host || "",
        port: account.customSmtp!.port || 587,
        secure: account.customSmtp!.secure || false,
        user: account.customSmtp!.user || "",
        fromEmail: account.customSmtp!.fromEmail || "",
        fromName: account.customSmtp!.fromName || account.name || "",
      }));
    }
  }, [account?.customSmtp]);

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = SMTP_PRESETS[key];
    if (p) {
      setSmtpForm((f) => ({ ...f, host: p.host, port: p.port, secure: p.secure }));
    }
  };

  const handleTestAndSave = async () => {
    if (!smtpForm.host || !smtpForm.user || !smtpForm.pass) {
      addToast("Please fill Host, Username and Password", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/account/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpForm),
      });
      const data = await res.json();
      if (!data.success) {
        addToast(data.error || "SMTP connection failed", "error");
        return;
      }
      addToast("Test email sent! Check your inbox ✓", "success");
    } catch {
      addToast("Could not connect — check credentials", "error");
      return;
    } finally {
      setTesting(false);
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/smtp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpForm),
      });
      const data = await res.json();
      if (data.success) {
        setAccount((prev) => prev ? ({
          ...prev,
          customSmtp: {
            enabled: true,
            host: smtpForm.host,
            port: smtpForm.port,
            secure: smtpForm.secure,
            user: smtpForm.user,
            fromEmail: smtpForm.fromEmail || smtpForm.user,
            fromName: smtpForm.fromName,
            isVerified: true,
          },
        }) : prev);
        addToast("Custom SMTP saved!", "success");
      } else {
        addToast(data.error || "Failed to save SMTP", "error");
      }
    } catch {
      addToast("Failed to save SMTP settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectSmtp = async () => {
    setDisconnectingSmtp(true);
    try {
      await fetch("/api/account/smtp/disconnect", { method: "POST" });
      setAccount((prev) => prev ? ({
        ...prev,
        customSmtp: { enabled: false, host: "", port: 587, secure: false, user: "", fromEmail: "", fromName: "", isVerified: false },
      }) : prev);
      setSmtpForm({ host: "", port: 587, secure: false, user: "", pass: "", fromEmail: "", fromName: account?.name || "" });
      addToast("Custom SMTP disconnected", "info");
    } catch {
      addToast("Failed to disconnect", "error");
    } finally {
      setDisconnectingSmtp(false);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = "/api/account/gmail/connect";
  };

  const handleDisconnectGmail = async () => {
    setDisconnectingGmail(true);
    try {
      await fetch("/api/account/gmail/disconnect", { method: "POST" });
      setAccount((prev) => prev ? ({
        ...prev,
        gmailOAuth: { connected: false, gmailAddress: "", fromName: "" },
      }) : prev);
      addToast("Gmail disconnected", "info");
    } catch {
      addToast("Failed to disconnect Gmail", "error");
    } finally {
      setDisconnectingGmail(false);
    }
  };

  const gmailConnected = account?.gmailOAuth?.connected && !!account?.gmailOAuth?.gmailAddress;
  const smtpConnected = account?.customSmtp?.isVerified && account?.customSmtp?.enabled;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] flex items-center gap-1.5">
          EMAIL SENDER
          <InfoTooltip
            content="Connect your own Gmail or SMTP to send emails from your domain. If not set, the platform default is used as fallback."
            title="Email Sender"
            align="start"
          />
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* ─── Gmail OAuth2 Card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs overflow-hidden p-2">
                  <svg className="h-full w-full object-contain" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    Connect Gmail
                    <InfoTooltip
                      content="Sign in with Google to send emails from your Gmail account. Works with Gmail & Google Workspace."
                      title="Gmail OAuth2"
                      align="start"
                    />
                  </h5>
                  {gmailConnected ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={11} /> {account?.gmailOAuth?.gmailAddress}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-400 mt-0.5">Send from your Gmail address</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gmailConnected ? (
                  <>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2 py-0.5 border border-emerald-200 dark:border-emerald-700">
                      <Check size={10} /> Connected
                    </span>
                    <button
                      onClick={handleDisconnectGmail}
                      disabled={disconnectingGmail}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition border border-red-200 dark:border-red-700"
                    >
                      {disconnectingGmail ? <Loader2 size={11} className="animate-spin" /> : <Unlink size={11} />}
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0066B2] text-white hover:bg-[#0055A0] transition shadow-sm"
                  >
                    <ExternalLink size={12} />
                    Connect Gmail
                  </button>
                )}
              </div>
            </div>
            {gmailConnected && (
              <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40 px-3 py-2.5">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  <span className="font-bold">✓ Active:</span> All emails will be sent from <strong>{account?.gmailOAuth?.gmailAddress}</strong> and will appear in your Gmail Sent folder.
                </p>
              </div>
            )}
            {!gmailConnected && (
              <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 px-3 py-2.5">
                <p className="text-[11px] text-blue-600 dark:text-blue-300 leading-relaxed">
                  <span className="font-bold">Recommended.</span> No passwords needed. Just sign in with Google — emails arrive from your Gmail address.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Custom SMTP Card ─────────────────────────────────────────────── */}
        <div className={`rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out ${showSmtp ? "md:col-span-2" : ""}`}>
          <div
            onClick={() => setShowSmtp((v) => !v)}
            className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] dark:bg-[#0f1a2c] overflow-hidden p-1.5">
                <Mail size={16} className="text-[#0066B2]" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Custom SMTP
                  <InfoTooltip
                    content="Use your own mail server (Gmail App Password, Outlook, SendGrid, Resend, etc.) to send from any domain."
                    title="Custom SMTP"
                    align="start"
                  />
                </h5>
                {smtpConnected ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={11} /> {account?.customSmtp?.fromEmail || account?.customSmtp?.user}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-400 mt-0.5">Gmail, Outlook, SendGrid, Resend…</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {smtpConnected && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2 py-0.5 border border-emerald-200 dark:border-emerald-700">
                  <Check size={10} /> Verified
                </span>
              )}
              <ChevronDown
                size={15}
                className={`text-zinc-400 transition-transform duration-200 ${showSmtp ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {showSmtp && (
            <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4 pt-4">
              {/* Preset Buttons */}
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Quick Setup</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SMTP_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        preset === key
                          ? "bg-[#0066B2] text-white border-[#0066B2]"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-[#0066B2]/50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gmail App Password hint */}
              {preset === "gmail" && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 px-3 py-2.5 flex gap-2">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Gmail requires a <strong>16-character App Password</strong>, not your regular password.{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
                      className="underline font-semibold">Generate one here ↗</a>
                  </p>
                </div>
              )}

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, host: e.target.value }))}
                    placeholder="e.g. smtp.gmail.com"
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Port</label>
                    <input
                      type="number"
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm((f) => ({ ...f, port: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-0.5">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">SSL</label>
                    <button
                      onClick={() => setSmtpForm((f) => ({ ...f, secure: !f.secure }))}
                      className={`h-8 w-12 rounded-xl border text-[10px] font-bold transition ${smtpForm.secure ? "bg-[#0066B2] text-white border-[#0066B2]" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"}`}
                    >
                      {smtpForm.secure ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Username / Email</label>
                  <input
                    type="email"
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, user: e.target.value }))}
                    placeholder="you@yourdomain.com"
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Password / App Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showPass ? "text" : "password"}
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm((f) => ({ ...f, pass: e.target.value }))}
                      placeholder={smtpConnected ? "••••••••••••••••" : "Enter password"}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">From Email</label>
                  <input
                    type="email"
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, fromEmail: e.target.value }))}
                    placeholder="Same as username"
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">From Name</label>
                  <input
                    type="text"
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, fromName: e.target.value }))}
                    placeholder={account?.name || "Your Name"}
                    className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/30"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  onClick={handleTestAndSave}
                  disabled={testing || saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#0066B2] text-white hover:bg-[#0055A0] transition shadow-sm disabled:opacity-60"
                >
                  {testing ? (
                    <><Loader2 size={12} className="animate-spin" /> Testing…</>
                  ) : saving ? (
                    <><Loader2 size={12} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Zap size={12} /> Test & Save</>
                  )}
                </button>
                {smtpConnected && (
                  <button
                    onClick={handleDisconnectSmtp}
                    disabled={disconnectingSmtp}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition border border-red-200 dark:border-red-700"
                  >
                    {disconnectingSmtp ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                    Disconnect
                  </button>
                )}
                {smtpConnected && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={11} /> Connected: {account?.customSmtp?.fromEmail || account?.customSmtp?.user}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Priority indicator */}
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <span className="font-bold text-zinc-600 dark:text-zinc-300">Sender priority:</span>{" "}
          <span className={gmailConnected ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>① Gmail OAuth</span>
          {" → "}
          <span className={smtpConnected && !gmailConnected ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>② Custom SMTP</span>
          {" → "}
          <span className={!gmailConnected && !smtpConnected ? "text-zinc-700 dark:text-zinc-200 font-semibold" : ""}>③ Platform fallback</span>
        </p>
      </div>
    </div>
  );
});
