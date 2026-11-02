"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Check, X, AlertTriangle } from "lucide-react";

interface AdminUser {
  email: string;
  name: string;
  plan: string;
  role: string;
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
}

const PLANS = ["Free", "Pro", "Growth", "Unlimited"];
const ROLES = ["user", "admin", "super_admin"];

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-gray-100 text-gray-600",
  Pro: "bg-blue-50 text-blue-700",
  Growth: "bg-purple-50 text-purple-700",
  Unlimited: "bg-amber-50 text-amber-700",
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-gray-100 text-gray-600",
  admin: "bg-green-50 text-green-700",
  super_admin: "bg-red-50 text-red-700",
};

interface PendingChange {
  email: string;
  name: string;
  field: "plan" | "role";
  from: string;
  to: string;
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
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total > 0 ? `${total.toLocaleString()} total` : "Loading..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Funnels</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.email}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-48">{user.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-48">{user.email}</div>
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={user.plan}
                        disabled={updating === user.email}
                        onChange={(e) => requestChange(user, "plan", e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${PLAN_COLORS[user.plan] || "bg-gray-100 text-gray-600"}`}
                      >
                        {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={user.role}
                        disabled={updating === user.email}
                        onChange={(e) => requestChange(user, "role", e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600"}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {user.leadCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {user.magnetCount}
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{user.joinedAt}</td>

                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {start}–{end} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-600 px-2">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Confirm Change</h2>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              You are about to change <span className="font-medium text-gray-900">{pending.name}</span>
            </p>
            <p className="text-sm text-gray-600 mb-5">
              {pending.field === "plan" ? "Plan" : "Role"}:{" "}
              <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">{pending.from}</span>
              {" → "}
              <span className="font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">{pending.to}</span>
            </p>
            <p className="text-xs text-gray-400 mb-5">This action will be recorded in the audit log.</p>

            <div className="flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
