"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  CalendarClock,
  Check,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  HelpCircle,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Plus,
  Rocket,
  Send,
  Sparkles,
  StopCircle,
  Trash2,
  Users,
  Eye,
  ExternalLink,
  ShieldAlert,
  Zap,
  Pencil,
  Code2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type SequenceEmail, type Account, type MagnetPage } from "@/lib/data";
import {
  loadPages,
  savePages,
  loadSequences,
  loadLeads,
  saveSequences,
  deleteSequence,
  loadAccount,
  syncWithDatabase,
} from "@/lib/store";
import { htmlToPlainText } from "@/lib/utils";

const standardDelays = [
  { label: "Instantly", minutes: 0 },
  { label: "15 minutes later", minutes: 15 },
  { label: "30 minutes later", minutes: 30 },
  { label: "1 hour later", minutes: 60 },
  { label: "2 hours later", minutes: 120 },
  { label: "4 hours later", minutes: 240 },
  { label: "12 hours later", minutes: 720 },
  { label: "1 day later", minutes: 1440 },
  { label: "2 days later", minutes: 2880 },
  { label: "3 days later", minutes: 4320 },
  { label: "4 days later", minutes: 5760 },
  { label: "5 days later", minutes: 7200 },
  { label: "1 week later", minutes: 10080 },
  { label: "2 weeks later", minutes: 20160 },
];

interface ExtendedSequenceEmail extends SequenceEmail {
  body?: string;
}

export default function SequenceEditor() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [seq, setSeq] = useState<Sequence | undefined>(undefined);
  const [emailsWithBody, setEmailsWithBody] = useState<ExtendedSequenceEmail[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "edit" | "preview">>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingAiForId, setGeneratingAiForId] = useState<string | null>(null);
  const [generatingAiBodyForId, setGeneratingAiBodyForId] = useState<string | null>(null);
  const [sendingTestForId, setSendingTestForId] = useState<string | null>(null);

  // Inline Sequence Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  useEffect(() => {
    const localAcc = loadAccount();
    if (localAcc) setAccount(localAcc);

    const localPages = loadPages();
    const localLeads = loadLeads();

    const resolveSeq = (seqList: Sequence[], pagesList = localPages, leadsList = localLeads) => {
      // 1. Check if matches standalone sequence by id OR by attached pageId
      let found = seqList.find((s) => s.id === params.id || s.pageId === params.id);
      const pageFound = pagesList.find((p) => p.id === params.id || (found && p.id === found.pageId));

      const associatedLeads = leadsList.filter(
        (l) =>
          (found && found.pageId && l.pageId === found.pageId) ||
          (found && l.sequence === found.name) ||
          (pageFound && (l.pageId === pageFound.id || l.page === pageFound.name))
      );

      const signupCount = Math.max(
        associatedLeads.length,
        found?.stats?.signedUp || 0,
        pageFound?.signups || 0
      );

      const liveOpened = associatedLeads.filter(
        (l) => l.opened || l.status === "opened" || l.status === "replied" || (l.openedSteps && l.openedSteps.length > 0)
      ).length;
      const liveDelivered =
        associatedLeads.filter(
          (l) =>
            l.status === "delivered" ||
            l.status === "opened" ||
            l.status === "completed" ||
            l.status === "replied"
        ).length || (signupCount > 0 ? signupCount : (found?.stats?.delivered || 0));

      const liveCompleted =
        associatedLeads.filter(
          (l) => l.status === "completed" || (l.sequenceStep && l.sequenceStep.toLowerCase().includes("completed"))
        ).length || (found?.stats?.completed || 0);

      const stats = {
        signedUp: signupCount,
        delivered: liveDelivered,
        opened: liveOpened,
        completed: liveCompleted,
        replied: associatedLeads.filter((l) => l.status === "replied").length,
        stopped: associatedLeads.filter((l) => l.status === "stopped").length,
      };

      if (found) {
        found.stats = stats;
        // Ensure email step metrics (sent & opened) and bodies are synchronized
        if (found.emails && found.emails.length > 0) {
          found.emails = found.emails.map((e, idx) => {
            const pageEmail = pageFound?.sequenceEmails?.[idx];
            let stepDelivered = e.sent || 0;
            let stepOpened = e.opened || 0;

            if (associatedLeads.length > 0) {
              const stepIdentifier = e.id || `se_${pageFound?.id}_${idx + 1}`;
              const leadsAtStep = associatedLeads.filter((l) => {
                if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                  return true;
                }
                if (!l.sequenceStep) return false;
                const stepMatch = l.sequenceStep.match(/Step\s+(\d+)/i);
                if (stepMatch) {
                  return parseInt(stepMatch[1], 10) >= idx + 2;
                }
                const emailMatch = l.sequenceStep.match(/Email\s+(\d+)/i);
                if (emailMatch) {
                  return parseInt(emailMatch[1], 10) >= idx + 1;
                }
                return false;
              });
              stepDelivered = leadsAtStep.length;
              stepOpened = leadsAtStep.filter((l) => {
                if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                  return true;
                }
                return false;
              }).length;
            } else if (found.stats) {
              stepDelivered = e.sent || 0;
              stepOpened = e.opened || 0;
            }

            return {
              ...e,
              subject: pageEmail?.subject || e.subject || `Follow-up #${idx + 1}`,
              delayMinutes: pageEmail?.delayMinutes !== undefined
                ? pageEmail.delayMinutes
                : pageEmail?.delayUnit === "minutes"
                ? (pageEmail.delayDays ?? 0)
                : pageEmail?.delayUnit === "hours"
                ? (pageEmail.delayDays ?? 1) * 60
                : (pageEmail?.delayDays ?? (idx === 0 ? 0 : 1)) * 1440,
              delayLabel: pageEmail
                ? (pageEmail.delayUnit === "minutes"
                  ? `${pageEmail.delayDays ?? 0}m delay`
                  : pageEmail.delayUnit === "hours"
                  ? `${pageEmail.delayDays ?? 1}h delay`
                  : `${pageEmail.delayDays ?? 1}d delay`)
                : e.delayLabel,
              sent: stepDelivered,
              opened: stepOpened,
              body: htmlToPlainText(
                pageEmail?.body ||
                (e as any).body ||
                `Hi {first_name},\n\nHope you find ${pageFound?.name || "this resource"} valuable!\n\nBest regards,`
              ),
            };
          });
        }
        return found;
      }

      if (pageFound) {
        const emailsList =
          pageFound.sequenceEmails && pageFound.sequenceEmails.length > 0
            ? pageFound.sequenceEmails.map((e, idx) => {
                const delayDays = e.delayDays ?? (idx === 0 ? 0 : 1);
                const delayMinutes =
                  e.delayMinutes !== undefined
                    ? e.delayMinutes
                    : e.delayUnit === "minutes"
                    ? (e.delayDays ?? 0)
                    : e.delayUnit === "hours"
                    ? delayDays * 60
                    : delayDays * 1440;

                const delayLabel =
                  delayMinutes === 0
                    ? "Instantly"
                    : delayMinutes < 60
                    ? `${delayMinutes} minute${delayMinutes > 1 ? "s" : ""} later`
                    : delayMinutes < 1440
                    ? `${Math.round(delayMinutes / 60)} hour${Math.round(delayMinutes / 60) > 1 ? "s" : ""} later`
                    : `${Math.round(delayMinutes / 1440)} day${Math.round(delayMinutes / 1440) > 1 ? "s" : ""} later`;

                const stepIdentifier = e.id || `se_${pageFound.id}_${idx + 1}`;
                let stepDelivered = 0;
                let stepOpened = 0;
                if (associatedLeads.length > 0) {
                  const leadsAtStep = associatedLeads.filter((l) => {
                    if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                      return true;
                    }
                    if (!l.sequenceStep) return false;
                    const stepMatch = l.sequenceStep.match(/Step\s+(\d+)/i);
                    if (stepMatch) {
                      return parseInt(stepMatch[1], 10) >= idx + 2;
                    }
                    const emailMatch = l.sequenceStep.match(/Email\s+(\d+)/i);
                    if (emailMatch) {
                      return parseInt(emailMatch[1], 10) >= idx + 1;
                    }
                    return false;
                  });
                  stepDelivered = leadsAtStep.length;
                  stepOpened = leadsAtStep.filter((l) => {
                    if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                      return true;
                    }
                    return false;
                  }).length;
                }

                return {
                  id: e.id || `se_${pageFound.id}_${idx + 1}`,
                  subject: e.subject || `Follow-up #${idx + 1}`,
                  delayLabel,
                  delayMinutes,
                  status: (pageFound.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
                  sent: stepDelivered,
                  opened: stepOpened,
                  body: htmlToPlainText(
                    e.body ||
                    `Hi {first_name},\n\nHere is your link to ${pageFound.name}.\n\nBest regards,`
                  ),
                };
              })
            : [
                {
                  id: `se_${pageFound.id}_1`,
                  subject: `Your ${pageFound.name} is ready for download!`,
                  delayLabel: "Instantly",
                  delayMinutes: 0,
                  status: "live" as const,
                  sent: liveDelivered,
                  opened: liveOpened,
                  body:
                    `Hi {first_name},\n\nHere is your requested download link for ${pageFound.name}:\n{resource_link}\n\nEnjoy!`,
                },
                {
                  id: `se_${pageFound.id}_2`,
                  subject: `Quick follow-up: Did you get a chance to check out the resource?`,
                  delayLabel: "1 day later",
                  delayMinutes: 1440,
                  status: "live" as const,
                  sent: liveDelivered,
                  opened: liveOpened,
                  body:
                    `Hi {first_name},\n\nI wanted to check in and see if you had any questions after reviewing ${pageFound.name}.\n\nLet me know if there's anything I can help with!`,
                },
              ];

        return {
          id: pageFound.id,
          name: `${pageFound.name} Sequence`,
          pageId: pageFound.id,
          status: (pageFound.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
          emails: emailsList,
          stopOnBooking: pageFound.stopOnCall ?? false,
          stats,
        };
      }
      return undefined;
    };

    const foundLocal = resolveSeq(loadSequences(), localPages, localLeads);
    if (foundLocal) {
      setSeq(foundLocal);
      setTitleInput(foundLocal.name);
      setEmailsWithBody(
        foundLocal.emails.map((e) => ({
          ...e,
          body: (e as any).body || "Hi {first_name},\n\nThank you for signing up!\n\nBest,",
        }))
      );
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        const remoteSeq = data.sequences || [];
        const remotePages = data.pages || localPages;
        const remoteLeads = data.leads || localLeads;
        const resolvedRemote = resolveSeq(remoteSeq, remotePages, remoteLeads);
        if (resolvedRemote) {
          setSeq(resolvedRemote);
          setTitleInput(resolvedRemote.name);
          setEmailsWithBody(
            resolvedRemote.emails.map((e) => ({
              ...e,
              body: (e as any).body || "Hi {first_name},\n\nThank you for signing up!\n\nBest,",
            }))
          );
        }
      }
    });
  }, [params.id]);

  if (!seq) {
    return (
      <DashboardShell account={account} title="Sequence">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sequence Not Found</h2>
          <p className="text-sm text-zinc-500 max-w-sm">The requested sequence may have been deleted or moved.</p>
          <Link
            href="/dashboard/sequences"
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0066B2] px-5 text-xs font-bold text-white transition hover:bg-[#005291] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sequences
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const attachedPage = seq.pageId
    ? loadPages().find((p) => p.id === seq.pageId)
    : loadPages().find((p) => p.id === seq.id);

  function update(next: Sequence, updatedEmails?: ExtendedSequenceEmail[]) {
    setSeq(next);
    const emailsToUse = updatedEmails || emailsWithBody;
    if (updatedEmails) setEmailsWithBody(updatedEmails);

    // 1. Save to sequences store
    const listToSave = loadSequences().map((s) => (s.id === next.id ? next : s));
    if (!listToSave.some((s) => s.id === next.id)) {
      listToSave.unshift(next);
    }
    saveSequences(listToSave);

    // 2. Synchronize bidirectional state to linked Lead Magnet Page
    const targetPageId = next.pageId || (loadPages().some((p) => p.id === next.id) ? next.id : undefined);
    if (targetPageId) {
      const currentPages = loadPages();
      const updatedPages = currentPages.map((p) => {
        if (p.id === targetPageId) {
          const convertedEmails = emailsToUse.map((em, idx) => {
            const min = em.delayMinutes ?? (idx === 0 ? 0 : 1440);
            let delayDays = Math.max(0, Math.round(min / 1440));
            let delayUnit: "hours" | "minutes" | undefined = undefined;

            if (min === 0) {
              delayDays = 0;
              delayUnit = "minutes";
            } else if (min < 60) {
              delayDays = min;
              delayUnit = "minutes";
            } else if (min < 1440) {
              delayDays = Math.max(1, Math.round(min / 60));
              delayUnit = "hours";
            }

            return {
              id: em.id || `se_${p.id}_${idx + 1}`,
              subject: em.subject || `Follow-up #${idx + 1}`,
              delayDays,
              delayUnit,
              delayMinutes: min,
              previewText: em.body ? em.body.slice(0, 80).replace(/\n/g, " ") : "",
              body: em.body || "",
            };
          });

          return {
            ...p,
            sequenceEnabled: next.status === "live",
            stopOnCall: next.stopOnBooking,
            sequenceEmails: convertedEmails,
          };
        }
        return p;
      });
      savePages(updatedPages);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    }
  }

  function handleSaveTitle() {
    if (!seq) return;
    const cleanTitle = titleInput.trim() || seq.name;
    setIsEditingTitle(false);
    if (cleanTitle !== seq.name) {
      update({ ...seq, name: cleanTitle });
      triggerToast("Sequence name updated!");
    }
  }

  function save() {
    if (!seq) return;
    setSaving(true);
    update({ ...seq, emails: emailsWithBody }, emailsWithBody);
    setTimeout(() => {
      setSaving(false);
      triggerToast("Sequence changes saved & synced!");
    }, 450);
  }

  function toggleStatus() {
    if (!seq) return;
    const nextStatus = seq.status === "live" ? "draft" : "live";
    update({ ...seq, status: nextStatus });
    triggerToast(nextStatus === "live" ? "Sequence is now Live!" : "Sequence paused.");
  }

  function patchEmail(id: string, patch: Partial<ExtendedSequenceEmail>) {
    if (!seq) return;
    const nextEmails = emailsWithBody.map((e) => (e.id === id ? { ...e, ...patch } : e));
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
  }

  function removeEmail(id: string, index?: number) {
    if (!seq) return;
    const nextEmails = emailsWithBody.filter((e, i) => (id && e.id ? e.id !== id : i !== index));
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    triggerToast("Email step removed.");
  }

  function moveEmailUp(index: number) {
    if (index <= 0 || !seq) return;
    const nextEmails = [...emailsWithBody];
    const temp = nextEmails[index - 1];
    nextEmails[index - 1] = nextEmails[index];
    nextEmails[index] = temp;
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    triggerToast("Step moved up.");
  }

  function moveEmailDown(index: number) {
    if (index >= emailsWithBody.length - 1 || !seq) return;
    const nextEmails = [...emailsWithBody];
    const temp = nextEmails[index + 1];
    nextEmails[index + 1] = nextEmails[index];
    nextEmails[index] = temp;
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    triggerToast("Step moved down.");
  }

  function addEmail() {
    if (!seq) return;
    const n = emailsWithBody.length;
    const newId = `e_${Date.now()}`;
    const delayObj = standardDelays[Math.min(n, standardDelays.length - 1)];
    const email: ExtendedSequenceEmail = {
      id: newId,
      subject: `Follow-up #${n + 1}: Checking in`,
      delayLabel: delayObj.label,
      delayMinutes: delayObj.minutes,
      status: "live",
      sent: 0,
      opened: 0,
      body: "Hi {first_name},\n\nJust following up to see if you had any questions!\n\nBest,",
    };
    const nextEmails = [...emailsWithBody, email];
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    setExpandedEmailId(newId);
    triggerToast("New email step added!");
  }

  function generateAiSubject(id: string) {
    setGeneratingAiForId(id);
    const emailIndex = emailsWithBody.findIndex((e) => e.id === id);
    const pageTitle = attachedPage?.name || "the resource";

    setTimeout(() => {
      const suggestionsByStep =
        emailIndex === 0
          ? [
              `Your ${pageTitle} is ready for download! 🎁`,
              `Access your ${pageTitle} inside (+ bonus resource)`,
              `Here is the ${pageTitle} you requested`,
              `Welcome! Get the most out of ${pageTitle}`,
            ]
          : emailIndex === 1
          ? [
              `Quick follow-up: Did you get a chance to check out ${pageTitle}?`,
              `1 quick question about your download...`,
              `3 tips to implement ${pageTitle} in under 10 minutes`,
              `The biggest mistake people make with ${pageTitle}`,
            ]
          : [
              `Case study: How to get 3x results with ${pageTitle}`,
              `Next steps: Scaling your growth faster 🚀`,
              `Did this work for you? (Feedback appreciated)`,
              `Following up: Ready for the next stage?`,
            ];

      const selected = suggestionsByStep[Math.floor(Math.random() * suggestionsByStep.length)];
      patchEmail(id, { subject: selected });
      setGeneratingAiForId(null);
      triggerToast("AI generated contextual subject line!");
    }, 500);
  }

  function generateAiBody(id: string) {
    setGeneratingAiBodyForId(id);
    const emailIndex = emailsWithBody.findIndex((e) => e.id === id);
    const pageTitle = attachedPage?.name || "this resource";
    const brandName = account?.brandName || account?.name || "Our Team";

    setTimeout(() => {
      let aiBody = "";
      if (emailIndex === 0) {
        aiBody = `Hi {first_name},\n\nThank you for requesting ${pageTitle}!\n\nYou can access your deliverable anytime via the direct link below:\n{resource_link}\n\nI recommend reviewing section 1 first, as it covers the foundational strategies you can implement right away.\n\nIf you have any questions or feedback, simply hit reply to this email.\n\nWarm regards,\n${brandName}`;
      } else if (emailIndex === 1) {
        aiBody = `Hi {first_name},\n\nI wanted to quickly follow up and see if you had a chance to look through ${pageTitle} yet.\n\nMost readers find that taking action within the first 24 hours leads to the highest results.\n\nHave you tried applying the core takeaways yet? Let me know where you're at—happy to share extra tips!\n\nBest,\n${brandName}`;
      } else {
        aiBody = `Hi {first_name},\n\nChecking in one last time regarding ${pageTitle}.\n\nIf you'd like to dive deeper or walk through how to apply this directly to your current workflow, feel free to let me know.\n\nLooking forward to hearing about your progress!\n\nCheers,\n${brandName}`;
      }

      patchEmail(id, { body: aiBody });
      setGeneratingAiBodyForId(null);
      triggerToast("AI generated complete email body!");
    }, 600);
  }

  function insertVariable(emailId: string, variableStr: string) {
    const targetEmail = emailsWithBody.find((e) => e.id === emailId);
    if (!targetEmail) return;
    const currentBody = targetEmail.body || "";
    const updatedBody = currentBody ? `${currentBody} ${variableStr}` : variableStr;
    patchEmail(emailId, { body: updatedBody });
    triggerToast(`Inserted ${variableStr}`);
  }

  async function sendTestEmail(emailId: string) {
    const targetEmail = emailsWithBody.find((e) => e.id === emailId);
    if (!targetEmail || !account?.email) return;

    setSendingTestForId(emailId);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendTestSequenceEmail",
          data: {
            recipientEmail: account.email,
            subject: targetEmail.subject || "Sequence Follow-up",
            bodyText: (targetEmail.body || "")
              .replace(/\{first_name\}/g, account.name || "Subscriber")
              .replace(/\{name\}/g, account.name || "Subscriber")
              .replace(/\{resource_link\}/g, attachedPage ? `https://magnets.app/${account?.username || "demo"}/${attachedPage.slug}` : "https://magnets.app/demo"),
          },
          email: account.email,
        }),
      });

      if (res.ok) {
        triggerToast(`Test email sent to ${account.email}!`);
      } else {
        triggerToast(`Preview generated for ${account.email}`);
      }
    } catch (_) {
      triggerToast(`Preview generated for ${account.email}`);
    } finally {
      setSendingTestForId(null);
    }
  }

  async function copyStartLink() {
    if (!seq) return;
    const link = `${typeof window !== "undefined" ? window.location.origin : "https://magnets.app"}/stop/${seq.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (_) {}
    setCopied(true);
    triggerToast("Unsubscribe stop link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const { signedUp, delivered, opened, replied, stopped } = seq.stats;
  const overallOpenRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;

  // Aggregate email dispatch volume (Step 1 + all follow-up steps) for UI transparency
  const totalEmailsDispatched = delivered + emailsWithBody.reduce((acc, e) => acc + (e.sent || 0), 0);
  const totalEmailsOpened = opened + emailsWithBody.reduce((acc, e) => acc + (e.opened || 0), 0);

  return (
    <DashboardShell account={account} title={`Sequence - ${seq.name}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/50 to-[#F8FAFC] dark:from-[#09090B] dark:via-[#121215] dark:to-[#09090B]">
        <div className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5 sm:pb-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <Link
                href="/dashboard/sequences"
                aria-label="Back to sequences"
                className="mt-0.5 sm:mt-1 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 max-w-full">
                      <input
                        type="text"
                        autoFocus
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") setIsEditingTitle(false);
                        }}
                        onBlur={handleSaveTitle}
                        className="text-lg sm:text-2xl font-bold tracking-tight bg-white dark:bg-zinc-900 border border-[#0066B2] rounded-xl px-2.5 py-0.5 text-zinc-900 dark:text-white outline-none shadow-xs w-full max-w-xs"
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="rounded-lg bg-[#0066B2] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#005291] shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingTitle(true)}
                      className="group flex items-center gap-2 cursor-pointer min-w-0"
                      title="Click to rename sequence"
                    >
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-[#0066B2] transition truncate">
                        {seq.name}
                      </h1>
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 opacity-60 sm:opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </div>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold border shadow-xs shrink-0 ${
                      seq.status === "live"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${seq.status === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {seq.status === "live" ? "Live Automation" : "Paused Drip"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  {attachedPage ? (
                    <>
                      <span>Linked Lead Magnet:</span>
                      <Link
                        href={`/dashboard/leadmagnets/${attachedPage.id}?tab=sequence`}
                        className="font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1 truncate max-w-full"
                      >
                        🎯 {attachedPage.name}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                    </>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 italic">Standalone sequence (Not attached to page)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions Button Group - 2-Column Grid on Mobile, Flex on Desktop */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
              <button
                onClick={copyStartLink}
                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] px-3 py-2.5 sm:px-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-xs cursor-pointer w-full sm:w-auto"
              >
                {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 shrink-0" />}
                <span className="truncate">{copied ? "Copied Link" : "Copy Stop Link"}</span>
              </button>

              <button
                onClick={toggleStatus}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2.5 sm:px-4 text-xs font-bold transition shadow-xs cursor-pointer border w-full sm:w-auto ${
                  seq.status === "live"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                    : "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{seq.status === "live" ? "Pause Sequence" : "Activate Sequence"}</span>
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 sm:px-5 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-60 w-full sm:w-auto"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin shrink-0" /> : <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />}
                <span className="truncate">{saving ? "Saving..." : "Save Changes"}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete sequence "${seq.name}"?`)) {
                    deleteSequence(seq.id);
                    router.push("/dashboard/sequences");
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 sm:px-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition shadow-xs cursor-pointer w-full sm:w-auto"
                title="Delete this sequence permanently"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 items-start">
            
            {/* Left Column: Email Timeline (8 Cols) */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                    <span>Automated Drip Sequence Steps</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {emailsWithBody.length} scheduled email{emailsWithBody.length !== 1 ? "s" : ""} in this follow-up funnel.
                  </p>
                </div>
                
                <button
                  onClick={addEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-zinc-800 transition shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Email Cards Container */}
              <div className="relative space-y-4">
                {/* Connecting Vertical Line */}
                <div className="absolute left-5 sm:left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#0066B2]/40 via-zinc-200 dark:via-zinc-800 to-transparent z-0 pointer-events-none" />

                {/* Step 1: Instant Resource Delivery Milestone Card */}
                <div className="relative z-10 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-[#18181B] dark:to-[#18181B] p-3.5 sm:p-5 shadow-sm transition hover:shadow-md backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-emerald-100 dark:border-emerald-950/60">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-600 text-xs font-extrabold text-white shadow-xs">
                        1
                      </span>
                      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-100/80 dark:bg-emerald-950/50 px-2 sm:px-2.5 py-1 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>Instant Delivery (On Signup)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        Initial resource download email
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3 shrink-0" />
                        100% Delivered ({delivered.toLocaleString()})
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                        <Eye className="h-3 w-3 shrink-0" />
                        {overallOpenRate}% Open Rate
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 rounded-xl p-3 border border-emerald-100 dark:border-emerald-950/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Resource Email Subject
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                        {attachedPage?.emailSubject || `Here is your requested resource: ${attachedPage?.name || "Download"}`}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        Dispatched immediately to deliver the file link upon form submission.
                      </p>
                    </div>

                    {attachedPage && (
                      <Link
                        href={`/dashboard/leadmagnets/edit/${attachedPage.id}?tab=delivery`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline shrink-0"
                      >
                        <span>Edit Delivery Template</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {emailsWithBody.map((email, i) => {
                  const isExpanded = expandedEmailId === email.id;
                  const currentTab = activeTab[email.id] || "edit";
                  const openPercentage = email.sent > 0 ? Math.round((email.opened / email.sent) * 100) : 0;
                  const isCustomDelay = !standardDelays.some((d) => d.minutes === email.delayMinutes);

                  return (
                    <div
                      key={email.id}
                      className="relative z-10 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-3.5 sm:p-5 shadow-sm transition hover:shadow-md backdrop-blur-sm"
                    >
                      {/* Card Top Control Row - Flexible for Mobile */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#0066B2] text-xs font-extrabold text-white shadow-xs">
                            {i + 2}
                          </span>
                          <span className="text-xs font-extrabold text-[#0066B2] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/60 shrink-0">
                            Follow-up #{i + 1}
                          </span>

                          {/* Delay Selector */}
                          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 sm:px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-400 shrink-0" />
                            <select
                              value={email.delayMinutes}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const d = standardDelays.find((x) => x.minutes === val);
                                patchEmail(email.id, {
                                  delayMinutes: val,
                                  delayLabel: d ? d.label : `${Math.round(val / 1440)} days later`,
                                });
                              }}
                              aria-label="Email delay"
                              className="bg-transparent font-bold text-xs text-zinc-900 dark:text-white outline-none cursor-pointer"
                            >
                              {isCustomDelay && (
                                <option value={email.delayMinutes} className="bg-white dark:bg-zinc-900">
                                  {email.delayLabel || `${Math.round(email.delayMinutes / 1440)} days later`}
                                </option>
                              )}
                              {standardDelays.map((d) => (
                                <option key={d.minutes} value={d.minutes} className="bg-white dark:bg-zinc-900">
                                  {d.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Reordering Controls */}
                          <div className="flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-1.5 sm:pl-2">
                            <button
                              disabled={i === 0}
                              onClick={() => moveEmailUp(i)}
                              title="Move step up"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={i === emailsWithBody.length - 1}
                              onClick={() => moveEmailDown(i)}
                              title="Move step down"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Eye className="h-3 w-3 shrink-0" />
                            {openPercentage}% Open Rate
                          </span>

                          <button
                            onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Toggle email content editor"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          <button
                            aria-label="Delete email step"
                            onClick={() => removeEmail(email.id, i)}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subject Line Input Row */}
                      <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Subject Line *
                          </label>
                          <button
                            onClick={() => generateAiSubject(email.id)}
                            disabled={generatingAiForId === email.id}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {generatingAiForId === email.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            )}
                            <span>AI Subject Suggest</span>
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={email.subject}
                            onChange={(e) => patchEmail(email.id, { subject: e.target.value })}
                            placeholder="Enter compelling email subject..."
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-2.5 sm:p-3 text-xs font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Expandable Email Body & Preview Section */}
                      {isExpanded && (
                        <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "edit" }))}
                                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentTab === "edit"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                              >
                                Edit Body
                              </button>
                              <button
                                onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "preview" }))}
                                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentTab === "preview"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                              >
                                Live Preview
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() => sendTestEmail(email.id)}
                                disabled={sendingTestForId === email.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition cursor-pointer disabled:opacity-50"
                                title="Send test email to your account email"
                              >
                                {sendingTestForId === email.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 text-zinc-400" />
                                )}
                                <span>Send Test</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick Variable Insertion Pills */}
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">Insert tag:</span>
                            {["{first_name}", "{resource_link}", "{name}"].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => insertVariable(email.id, tag)}
                                className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono text-zinc-600 dark:text-zinc-300 hover:bg-[#0066B2]/10 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>

                          {currentTab === "edit" ? (
                            <textarea
                              rows={6}
                              value={htmlToPlainText(email.body || "")}
                              onChange={(e) => patchEmail(email.id, { body: e.target.value })}
                              placeholder="Write your email content here..."
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 sm:p-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none font-sans leading-relaxed"
                            />
                          ) : (
                            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 p-3 sm:p-4 text-xs space-y-3">
                              <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex justify-between items-center gap-2">
                                <div className="truncate">
                                  From: {account?.name || "Your Brand"} &lt;{account?.email || "hello@yourbrand.com"}&gt;
                                  <br />
                                  Subject: <span className="text-zinc-800 dark:text-zinc-200">{email.subject}</span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold shrink-0">
                                  Preview Mode
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed pt-1 text-xs">
                                {(email.body || "")
                                  .replace(/\{first_name\}/g, "Alex")
                                  .replace(/\{name\}/g, "Alex")
                                  .replace(/\{resource_link\}/g, attachedPage ? `https://magnets.app/${account?.username || "demo"}/${attachedPage.slug}` : "https://download-resource.com")}
                              </div>
                              <div className="pt-2 sm:pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between gap-2">
                                <span className="truncate">No longer want these emails? <span className="text-rose-500 underline cursor-pointer">Unsubscribe</span></span>
                                <span className="shrink-0">Stop link attached</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Footer Info */}
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Send className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span>{email.sent.toLocaleString()} Delivered</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>{email.opened.toLocaleString()} Opened</span>
                        </span>

                        <button
                          onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                          className="text-[#0066B2] dark:text-[#38BDF8] hover:underline font-bold text-[11px] cursor-pointer self-start sm:self-auto"
                        >
                          {isExpanded ? "Collapse Editor" : "Edit Content & Body →"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Email Step Action Button */}
                <button
                  onClick={addEmail}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-[#18181B]/40 py-3.5 sm:py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:border-[#38BDF8] dark:hover:text-[#38BDF8] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Email Step to Funnel</span>
                </button>
              </div>
            </div>

            {/* Right Column: Performance & Settings (4 Cols) */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              
              {/* Performance Metrics Card */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span>Funnel Performance</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {overallOpenRate}% Open Rate
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Contacts Section */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      <span>Enrolled Contacts</span>
                    </div>

                    <div className="space-y-2 pl-0.5">
                      {[
                        { label: "Signed up", value: signedUp, icon: Users, color: "text-blue-500 bg-blue-500/10" },
                        { label: "Completed", value: seq.stats.completed || (delivered > 0 ? delivered : 0), icon: Check, color: "text-purple-500 bg-purple-500/10" },
                        { label: "Replied", value: replied, icon: MessageSquare, color: "text-amber-500 bg-amber-500/10" },
                        { label: "Stopped", value: stopped, icon: StopCircle, color: "text-rose-500 bg-rose-500/10" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2.5 font-medium text-zinc-600 dark:text-zinc-400">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${row.color}`}>
                              <row.icon className="h-3 w-3" />
                            </span>
                            {row.label}
                          </span>
                          <span className="font-extrabold text-zinc-900 dark:text-white font-mono">{row.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Email Volume Section */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      <span>Total Email Sends</span>
                    </div>

                    <div className="space-y-2 pl-0.5">
                      {[
                        { label: "Total Delivered", value: totalEmailsDispatched, icon: Send, color: "text-indigo-500 bg-indigo-500/10" },
                        { label: "Total Opened", value: totalEmailsOpened, icon: MailOpen, color: "text-emerald-500 bg-emerald-500/10" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2.5 font-medium text-zinc-600 dark:text-zinc-400">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${row.color}`}>
                              <row.icon className="h-3 w-3" />
                            </span>
                            {row.label}
                          </span>
                          <span className="font-extrabold text-zinc-900 dark:text-white font-mono">{row.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Open Rate Visual Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Email Engagement Rate</span>
                    <span>{overallOpenRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066B2] to-emerald-400"
                      style={{ width: `${Math.min(overallOpenRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* View Leads Link */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Link
                    href={`/dashboard/leads?search=${encodeURIComponent(attachedPage?.name || seq.name)}`}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                  >
                    <span>View enrolled leads ({signedUp})</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Stop on Booking Automation Card */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Stop Drip on Booking</span>
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Automatically pause follow-up emails when a lead schedules a call via Calendly or Cal.com.
                    </p>
                  </div>

                  <button
                    role="switch"
                    aria-checked={seq.stopOnBooking}
                    onClick={() => {
                      const nextVal = !seq.stopOnBooking;
                      update({ ...seq, stopOnBooking: nextVal });
                      triggerToast(nextVal ? "Stop on booking enabled!" : "Stop on booking disabled.");
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      seq.stopOnBooking ? "bg-[#0066B2]" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        seq.stopOnBooking ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <Link
                    href="/dashboard/integration"
                    className="text-[11px] font-semibold text-zinc-500 hover:text-[#0066B2] dark:hover:text-[#38BDF8] flex items-center gap-1"
                  >
                    <span>Configure Calendar Integrations</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Unsubscribe & Stop Link Explanation */}
              <div className="rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <HelpCircle className="h-4 w-4" />
                  <span>How Stop Links Work</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every sequence email automatically attaches your unique stop link at the bottom. When a lead clicks it, their email status changes to <span className="font-bold text-rose-500">Stopped</span> and no further drip emails will be sent.
                </p>
                <div className="pt-1">
                  <Link
                    href={`/stop/${seq.id}`}
                    target="_blank"
                    className="text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Preview Live Stop Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}