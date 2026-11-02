"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Shield, RefreshCw } from "lucide-react";

interface AuditEntry {
  id: string;
  adminEmail: string;
  adminRole: string;
  action: "plan_change" | "role_change";
  targetEmail: string;
  targetName: string;
  before: Record<string, string>;
  after: Record<string, string>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  plan_change: "Plan Change",
  role_change: "Role Change",
};

const ACTION_COLORS: Record<string, string> = {
  plan_change: "bg-blue-50 text-blue-700",
  role_change: "bg-amber-50 text-amber-700",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(actionFilter && { action: actionFilter }),
      });
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, refreshKey]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every admin action recorded — {total > 0 ? `${total} entries` : "no entries yet"}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          <option value="plan_change">Plan Change</option>
          <option value="role_change">Role Change</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No audit entries yet.</p>
            <p className="text-xs text-gray-300 mt-1">
              Actions like plan and role changes will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                {/* Action badge */}
                <div className="pt-0.5 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-600"}`}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{entry.adminEmail}</span>
                    <span className="text-xs text-gray-400">changed</span>
                    <button
                      onClick={() => router.push(`/admin/users/${encodeURIComponent(entry.targetEmail)}`)}
                      className="text-sm font-medium text-blue-600 hover:underline truncate max-w-48"
                    >
                      {entry.targetName || entry.targetEmail}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {Object.keys(entry.before).map((key) => (
                      <span key={key} className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-mono">
                          {entry.before[key]}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-mono">
                          {entry.after[key]}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div className="text-xs text-gray-400 shrink-0 pt-0.5" title={new Date(entry.createdAt).toLocaleString()}>
                  {timeAgo(entry.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 50 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
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
    </div>
  );
}
