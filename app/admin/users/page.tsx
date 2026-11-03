"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Check, X, AlertTriangle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminUser {
  email: string;
  name: string;
  plan: string;
  role: string;
  suspended?: boolean;
  paymentStatus: string;
  paymentProvider: string;
  emailVerified: boolean;
  joinedAt: string;
  customDomain: string;
  linkedinConnected: boolean;
  gmailConnected: boolean;
  smtpConnected: boolean;
  hasPaidSubscription: boolean;
  magnetCount: number;
  leadCount: number;
  storageBytes: number;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PLANS = ["Free", "Pro"];
const ROLES = ["user", "admin", "super_admin"];

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  Pro: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  admin: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  super_admin: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

interface PendingChange {
  email: string;
  name: string;
  field: "plan" | "role";
  from: string;
  to: string;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

/** Pill-style dropdown used inside each table row for Plan / Role */
function RowSelect({
  value,
  options,
  colorMap,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  colorMap: Record<string, string>;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none ${colorMap[value] || "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}
      >
        {value}
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-full z-50 mt-1.5 min-w-[130px] rounded-xl border border-zinc-200/80 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  value === opt
                    ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Filter dropdown used in the top toolbar for All Plans / All Roles */
function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const label = value || placeholder;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] px-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none"
      >
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] rounded-xl border border-zinc-200/80 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
          >
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                !value
                  ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
              }`}
            >
              {placeholder}
              {!value && <Check className="w-3 h-3 shrink-0" />}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                  value === opt
                    ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingChange | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(planFilter && { plan: planFilter }),
        ...(roleFilter && { role: roleFilter }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Could not load users. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers, search]);

  function requestChange(user: AdminUser, field: "plan" | "role", to: string) {
    const from = field === "plan" ? user.plan : user.role;
    if (from === to) return;
    setPending({ email: user.email, name: user.name, field, from, to });
  }

  async function confirmChange() {
    if (!pending) return;
    const { email, field, to } = pending;
    setPending(null);
    setUpdating(email);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.email === email
            ? { ...u, plan: data.plan ?? u.plan, role: data.role ?? u.role }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  }

  const start = (page - 1) * 25 + 1;
  const end = Math.min(page * 25, total);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Users</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {total > 0 ? `${total.toLocaleString()} total` : "Loading..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#0066B2] focus:border-transparent"
          />
        </div>

        <FilterSelect
          value={planFilter}
          placeholder="All Plans"
          options={PLANS}
          onChange={(v) => { setPlanFilter(v); setPage(1); }}
        />

        <FilterSelect
          value={roleFilter}
          placeholder="All Roles"
          options={ROLES}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Role</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Funnels</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Storage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Verified</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.email}
                    className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-zinc-900 dark:text-white truncate max-w-48">{user.name}</div>
                        {user.suspended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 shrink-0">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-48">{user.email}</div>
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowSelect
                        value={user.plan}
                        options={PLANS}
                        colorMap={PLAN_COLORS}
                        disabled={updating === user.email}
                        onChange={(v) => requestChange(user, "plan", v)}
                      />
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowSelect
                        value={user.role}
                        options={ROLES}
                        colorMap={ROLE_COLORS}
                        disabled={updating === user.email}
                        onChange={(v) => requestChange(user, "role", v)}
                      />
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {user.leadCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {user.magnetCount}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${user.storageBytes > 500 * 1024 * 1024 ? "text-red-600 dark:text-red-400" : user.storageBytes > 100 * 1024 * 1024 ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {formatBytes(user.storageBytes)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-xs">
                      {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white transition-colors whitespace-nowrap"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {start}–{end} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-[#E2F0FD] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 px-2">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-[#E2F0FD] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1F] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Confirm Change</h2>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              You are about to change <span className="font-medium text-zinc-900 dark:text-white">{pending.name}</span>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              {pending.field === "plan" ? "Plan" : "Role"}:{" "}
              <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded text-xs">{pending.from}</span>
              {" → "}
              <span className="font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded text-xs">{pending.to}</span>
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">This action will be recorded in the audit log.</p>

            <div className="flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 px-4 py-2 text-sm font-medium bg-[#0066B2] text-white rounded-xl hover:bg-[#005291] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
