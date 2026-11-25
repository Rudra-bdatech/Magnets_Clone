import DashboardShell from "@/components/dashboard/dashboard-shell";
import { SupportWidget } from "./support-widget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supportWidgetEnabled = process.env.NEXT_PUBLIC_SUPPORT_WIDGET_ENABLED === "true";
  const supportBaseUrl = process.env.NEXT_PUBLIC_SUPPORT_BASE_URL?.replace(/\/+$/, "");
  const supportInboxId = process.env.NEXT_PUBLIC_SUPPORT_INBOX_ID;

  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      {supportWidgetEnabled && supportBaseUrl && supportInboxId && (
        <SupportWidget baseURL={supportBaseUrl} inboxID={supportInboxId} />
      )}
    </>
  );
}
