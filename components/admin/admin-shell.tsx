"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Shield, ArrowLeft, TrendingUp, Layers, BarChart2 } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/funnels", label: "Funnels", icon: Layers },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
];

export default function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#0E0E10]">
      <aside className="w-56 h-screen bg-[#F0F7FF] dark:bg-[#171717] border-r border-[#E0EDFB] dark:border-white/[0.08] flex flex-col shrink-0 overflow-y-auto" data-lenis-prevent>
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#E0EDFB] dark:border-white/[0.08]">
          <div className="text-sm font-bold text-zinc-900 dark:text-white">Super Admin Console</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{email}</div>
          <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
            {role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#0066B2] text-white dark:bg-[#0066B2]/20 dark:text-[#38BDF8] dark:border dark:border-[#0066B2]/40"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[#E0EDFB] dark:border-white/[0.08]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto" data-lenis-prevent>{children}</main>
    </div>
  );
}
