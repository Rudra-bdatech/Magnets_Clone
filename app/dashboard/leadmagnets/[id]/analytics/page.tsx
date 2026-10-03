"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import AnalyticsLinearView from "@/components/analytics/analytics-linear-view";
import AnalyticsHelpModal from "@/components/analytics/analytics-help-modal";
import { type MagnetPage, type Account, type Lead } from "@/lib/data";
import { loadPages, loadAccount, loadLeads, syncWithDatabase } from "@/lib/store";

export default function LeadMagnetAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [page, setPage] = useState<MagnetPage | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const localAcc = loadAccount();
    if (localAcc) setAccount(localAcc);
    const pages = loadPages();
    const foundLocal = pages.find((p) => p.id === params.id);
    if (foundLocal) setPage(foundLocal);

    const localLeads = loadLeads().filter((l) => l.pageId === params.id);
    if (localLeads.length > 0) setLeads(localLeads);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          const found = data.pages.find((p) => p.id === params.id);
          if (found) setPage(found);
        }
        if (data.account) setAccount(data.account);
        if (data.leads) {
          const magnetLeads = data.leads.filter((l) => l.pageId === params.id);
          setLeads(magnetLeads);
        }
      }
    });
  }, [params.id]);

  const isLockedPdf = page?.template === "locked-pdf" || (page as any)?.pdfFreePages !== undefined;

  return (
    <DashboardShell
      account={account}
      title="Analytics"
      activeNavHref={isLockedPdf ? "/dashboard/locked-pdf" : "/dashboard/landing-page"}
    >
      <AnalyticsLinearView
        account={account}
        page={page}
        leads={leads}
        onOpenHelp={() => setHelpOpen(true)}
        isPerMagnet={true}
      />
      <AnalyticsHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </DashboardShell>
  );
}
