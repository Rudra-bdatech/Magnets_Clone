"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AnalyticsLinearView from "@/components/analytics/analytics-linear-view";
import AnalyticsHelpModal from "@/components/analytics/analytics-help-modal";
import { type MagnetPage, type Account, type Lead } from "@/lib/data";
import { loadPages, loadAccount, loadLeads, syncWithDatabase } from "@/lib/store";

export default function GeneralAnalyticsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);
    const localPages = loadPages();
    if (localPages.length > 0) setPages(localPages);
    const localLeads = loadLeads();
    if (localLeads.length > 0) setLeads(localLeads);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) setPages(data.pages);
        if (data.account) setAccount(data.account);
        if (data.leads) setLeads(data.leads);
      }
    });
  }, []);

  return (
    <>
      <AnalyticsLinearView
        account={account}
        pages={pages}
        leads={leads}
        onOpenHelp={() => setHelpOpen(true)}
        isPerMagnet={false}
      />
      <AnalyticsHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
