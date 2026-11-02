"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Shield, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Funnels Admin</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{email}</div>
          <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
            {role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
