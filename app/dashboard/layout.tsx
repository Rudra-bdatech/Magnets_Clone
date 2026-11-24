import Script from "next/script";
import DashboardShell from "@/components/dashboard/dashboard-shell";

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
        <>
          <Script
            id="libredesk-settings"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.LibredeskSettings = {
                  baseURL: ${JSON.stringify(supportBaseUrl)},
                  inboxID: ${JSON.stringify(supportInboxId)}
                };
              `,
            }}
          />
          <Script
            id="libredesk-widget"
            src={`${supportBaseUrl}/widget.js`}
            strategy="afterInteractive"
          />
        </>
      )}
    </>
  );
}
