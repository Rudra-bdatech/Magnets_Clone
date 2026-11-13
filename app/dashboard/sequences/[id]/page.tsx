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
  MoreVertical,
  Lock,
  Magnet,
  LayoutGrid,
  List,
  Workflow,
  GitFork,
  X,
  Sliders,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type SequenceEmail, type Account, type MagnetPage } from "@/lib/data";
import { useSidebar } from "@/components/dashboard/dashboard-shell";
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
import SequenceRichEditor from "@/components/sequences/SequenceRichEditor";

const standardDelays = [
  { label: "Instantly", minutes: 0 },
  { label: "5 minutes later", minutes: 5 },
  { label: "10 minutes later", minutes: 10 },
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
  previewText?: string;
}

export default function SequenceEditor() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [seq, setSeq] = useState<Sequence | undefined>(undefined);
  const [emailsWithBody, setEmailsWithBody] = useState<ExtendedSequenceEmail[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "edit" | "preview">>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const [sendingTestForId, setSendingTestForId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState<"flow" | "list">("flow");
  const [selectedFlowNodeIndex, setSelectedFlowNodeIndex] = useState<number>(0);
  const [showCanvasInspector, setShowCanvasInspector] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"content" | "timing">("content");
  const [editingDelayIndex, setEditingDelayIndex] = useState<number | null>(null);

  // Infinite Canvas 2D Pan & Drag State
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 20 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasViewportRef = useRef<HTMLDivElement>(null);

  // Wheel listener: natural pan on scroll, zoom on pinch/Ctrl+scroll
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el || editorViewMode !== "flow") return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = e.deltaY < 0 ? 8 : -8;
        setCanvasZoom((prev) => Math.min(150, Math.max(50, prev + zoomDelta)));
      } else {
        setCanvasPan((prev) => ({
          x: prev.x - e.deltaX * 0.9,
          y: prev.y - e.deltaY * 0.9,
        }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [editorViewMode]);

  // Global mousemove & mouseup during canvas drag
  useEffect(() => {
    if (!isDraggingCanvas) return;
    const onGlobalMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCanvasPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    };
    const onGlobalMouseUp = () => {
      setIsDraggingCanvas(false);
    };
    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [isDraggingCanvas]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("a") ||
      target.closest("[role='button']")
    ) {
      return;
    }
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: canvasPan.x,
      panY: canvasPan.y,
    };
  };

  const recenterCanvas = () => {
    setCanvasPan({ x: 0, y: 20 });
    setCanvasZoom(100);
  };

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
              previewText: pageEmail?.previewText || (e as any).previewText || "",
              body:
                pageEmail?.body ||
                (e as any).body ||
                `Hi {first_name},\n\nHope you find ${pageFound?.name || "this resource"} valuable!\n\nBest regards,`,
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

                const isPageLive = pageFound.status === "live";
                const pageSeqStatus: "draft" | "live" = (isPageLive && pageFound.sequenceEnabled !== false) ? "live" : "draft";

                return {
                  id: e.id || `se_${pageFound.id}_${idx + 1}`,
                  subject: e.subject || `Follow-up #${idx + 1}`,
                  delayLabel,
                  delayMinutes,
                  status: pageSeqStatus,
                  sent: stepDelivered,
                  opened: stepOpened,
                  previewText: e.previewText || "",
                  body:
                    e.body ||
                    `Hi {first_name},\n\nHere is your link to ${pageFound.name}.\n\nBest regards,`,
                };
              })
            : [
                {
                  id: `se_${pageFound.id}_1`,
                  subject: `Your ${pageFound.name} is ready for download!`,
                  delayLabel: "Instantly",
                  delayMinutes: 0,
                  status: (pageFound.status === "live" && pageFound.sequenceEnabled !== false ? "live" : "draft") as "draft" | "live",
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
                  status: (pageFound.status === "live" && pageFound.sequenceEnabled !== false ? "live" : "draft") as "draft" | "live",
                  sent: liveDelivered,
                  opened: liveOpened,
                  body:
                    `Hi {first_name},\n\nI wanted to check in and see if you had any questions after reviewing ${pageFound.name}.\n\nLet me know if there's anything I can help with!`,
                },
              ];

        const isPageLive = pageFound.status === "live";
        const pageSeqStatus: "draft" | "live" = (isPageLive && pageFound.sequenceEnabled !== false) ? "live" : "draft";

        return {
          id: pageFound.id,
          name: `${pageFound.name} Sequence`,
          pageId: pageFound.id,
          status: pageSeqStatus,
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
          previewText: (e as any).previewText || "",
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
              previewText: (e as any).previewText || "",
              body: (e as any).body || "Hi {first_name},\n\nThank you for signing up!\n\nBest,",
            }))
          );
        }
      }
    });
  }, [params.id]);

  if (!seq) {
    return (
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
    if (nextStatus === "live" && seq.pageId) {
      const currentPages = loadPages();
      const pageFound = currentPages.find((p) => p.id === seq.pageId);
      if (pageFound && pageFound.status !== "live") {
        triggerToast(`Cannot activate: The funnel "${pageFound.name}" is currently in Draft.`);
        return;
      }
    }
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
    const isFirstInStandalone = !attachedPage && n === 0;
    const delayObj = isFirstInStandalone ? standardDelays[0] : standardDelays[Math.min(n, standardDelays.length - 1)];
    const email: ExtendedSequenceEmail = {
      id: newId,
      subject: isFirstInStandalone
        ? "Welcome! Here's what to expect"
        : `Follow-up #${attachedPage ? n + 1 : n}: Checking in`,
      delayLabel: isFirstInStandalone ? "Instantly" : delayObj.label,
      delayMinutes: isFirstInStandalone ? 0 : delayObj.minutes,
      status: "live",
      sent: 0,
      opened: 0,
      body: isFirstInStandalone
        ? "Hi {first_name},\n\nWelcome! We're thrilled to have you here.\n\nOver the coming days, I'll be sharing key insights and actionable resources with you to help you reach your goals.\n\nIf you ever have any questions, simply reply to this email.\n\nBest regards,"
        : "Hi {first_name},\n\nJust following up to see if you had any questions!\n\nBest,",
    };
    const nextEmails = [...emailsWithBody, email];
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    setExpandedEmailId(newId);
    triggerToast("New email step added!");
  }

  function insertEmailAt(index: number) {
    if (!seq) return;
    const newId = `e_${Date.now()}`;
    const delayObj = standardDelays[Math.min(index + 1, standardDelays.length - 1)] || standardDelays[1];
    const newEmail: ExtendedSequenceEmail = {
      id: newId,
      subject: `Follow-up #${attachedPage ? index + 2 : index + 1}: Quick check-in`,
      delayLabel: delayObj.label,
      delayMinutes: delayObj.minutes,
      status: "live",
      sent: 0,
      opened: 0,
      body: "Hi {first_name},\n\nJust following up to share another quick tip to help you get the best results!\n\nBest regards,\n{name}",
      previewText: "Quick tip to help you get the best results...",
    };
    const nextEmails = [...emailsWithBody];
    nextEmails.splice(index, 0, newEmail);
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    setSelectedFlowNodeIndex(index);
    setShowCanvasInspector(true);
    triggerToast("New step inserted into workflow!");
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
            previewText: targetEmail.previewText || "",
            bodyText: (targetEmail.body || "")
              .replace(/\{first_name\}/g, account.name || "Subscriber")
              .replace(/\{name\}/g, account.name || "Subscriber")
              .replace(/\{resource_link\}/g, attachedPage ? `https://funnels.co.in/${account?.username || "demo"}/${attachedPage.slug}` : "https://funnels.co.in/demo"),
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


  const { signedUp, delivered, opened, replied, stopped } = seq.stats;
  const overallOpenRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;

  // Aggregate email dispatch volume (Step 1 + all follow-up steps) for UI transparency
  const totalEmailsDispatched = delivered + emailsWithBody.reduce((acc, e) => acc + (e.sent || 0), 0);
  const totalEmailsOpened = opened + emailsWithBody.reduce((acc, e) => acc + (e.opened || 0), 0);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#EFF6FF]/40 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0a0a0a] pb-12">
        <div className={`flex-1 px-3 sm:px-6 py-3.5 sm:py-6 lg:px-8 mx-auto w-full space-y-4 sm:space-y-6 lg:space-y-8 transition-[max-width] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[max-width] ${isCollapsed ? "max-w-[1440px]" : "max-w-7xl"}`}>
          
          {/* Header Bar - Clean Borderless Hierarchy */}
          <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-center lg:justify-between pb-1 sm:pb-2">
            <div className="flex items-start gap-2.5 sm:gap-4">
              <Link
                href="/dashboard/sequences"
                aria-label="Back to sequences"
                className="mt-0.5 sm:mt-1 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/10 active:scale-95 transition shadow-xs"
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
                        className="text-base sm:text-2xl font-bold tracking-tight bg-white dark:bg-[#121212] border border-[#0066B2] rounded-xl px-2.5 py-1 text-zinc-900 dark:text-white outline-none shadow-xs w-full max-w-[200px] sm:max-w-xs"
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="rounded-lg bg-[#0066B2] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#005291] active:scale-95 shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingTitle(true)}
                      className="group flex items-center gap-1.5 sm:gap-2 cursor-pointer min-w-0"
                      title="Click to rename sequence"
                    >
                      <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-[#0066B2] transition truncate">
                        {seq.name}
                      </h1>
                      <span className="p-1 rounded-md text-zinc-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition shrink-0 hover:bg-zinc-100 dark:hover:bg-white/10">
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold border shadow-xs shrink-0 ${
                      seq.status === "live"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${seq.status === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {seq.status === "live" ? "Live Automation" : "Paused Drip"}
                  </span>
                </div>

                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  {attachedPage ? (
                    <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                      <span className="text-[11px] sm:text-xs text-zinc-500 shrink-0">Linked Funnel:</span>
                      <Link
                        href={`/dashboard/leadmagnets/${attachedPage.id}?tab=sequence`}
                        className="font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1.5 truncate text-[11px] sm:text-xs bg-blue-50/60 dark:bg-blue-950/30 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40"
                      >
                        {attachedPage.template === "locked-pdf" ? (
                          <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                        ) : (
                          <Magnet className="h-3 w-3 text-emerald-500 shrink-0" />
                        )}
                        <span className="truncate">{attachedPage.name}</span>
                        <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 opacity-70 ml-0.5" />
                      </Link>
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs italic">Standalone sequence</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Button Bar */}
            {/* Desktop Action Row (lg and above) */}
            <div className="hidden lg:flex items-center gap-2.5 w-auto">
              <button
                onClick={toggleStatus}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer border active:scale-95 ${
                  seq.status === "live"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                    : "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <Zap className="h-4 w-4 shrink-0" />
                <span>{seq.status === "live" ? "Pause Sequence" : "Activate Sequence"}</span>
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete sequence "${seq.name}"?`)) {
                    deleteSequence(seq.id);
                    router.push("/dashboard/sequences");
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 active:scale-95 transition shadow-xs cursor-pointer"
                title="Delete this sequence permanently"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>Delete</span>
              </button>
            </div>

            {/* Mobile / Tablet Single-Row Action Bar */}
            <div className="lg:hidden flex items-center gap-2 w-full pt-1 relative">
              {/* Save Changes: Full Primary CTA */}
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] active:bg-[#005291] px-4 py-2.5 text-xs font-bold text-white active:scale-[0.98] transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Check className="h-3.5 w-3.5 shrink-0 text-white" />}
                <span className="truncate">{saving ? "Saving..." : "Save Changes"}</span>
              </button>

              {/* Pause / Resume Button */}
              <button
                onClick={toggleStatus}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer border active:scale-95 shrink-0 ${
                  seq.status === "live"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 active:bg-amber-100"
                    : "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 active:bg-emerald-100"
                }`}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-semibold">{seq.status === "live" ? "Pause" : "Activate"}</span>
              </button>

              {/* More Options (•••) Trigger */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="More options"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-200 active:bg-zinc-100 dark:active:bg-white/10 active:scale-95 transition shadow-xs cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Mobile Popover Menu */}
                {isMobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#171717] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (window.confirm(`Are you sure you want to delete sequence "${seq.name}"?`)) {
                            deleteSequence(seq.id);
                            router.push("/dashboard/sequences");
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Sequence</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Quick KPI Summary Bar (Visible only on mobile/tablet) */}
          <div className="lg:hidden grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] dark:shadow-none p-2.5 sm:p-3 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block truncate">Enrolled</span>
              <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white font-mono">{signedUp.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] dark:shadow-none p-2.5 sm:p-3 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block truncate">Delivered</span>
              <span className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{delivered.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] dark:shadow-none p-2.5 sm:p-3 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block truncate">Open Rate</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{overallOpenRate}%</span>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className={`grid gap-5 sm:gap-8 items-start ${isCanvasMaximized && editorViewMode === "flow" ? "grid-cols-1" : "lg:grid-cols-12"}`}>
            
            {/* Left Column: Email Timeline (8 Cols or 12 Cols if Canvas is Maximized) */}
            <div className={`${isCanvasMaximized && editorViewMode === "flow" ? "col-span-1" : "lg:col-span-8"} space-y-4 sm:space-y-6`}>
              
              {/* Timeline Header */}
              {/* Timeline Header with Flow Canvas / Step List Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 bg-zinc-200/70 dark:bg-[#121212] border border-transparent dark:border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorViewMode("flow")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editorViewMode === "flow"
                          ? "bg-white dark:bg-white/10 text-[#0066B2] dark:text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      <Workflow className="h-3.5 w-3.5" />
                      <span>Flow Canvas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode("list")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editorViewMode === "list"
                          ? "bg-white dark:bg-white/10 text-[#0066B2] dark:text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>Step List</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-zinc-400">
                    {attachedPage ? emailsWithBody.length + 1 : emailsWithBody.length} total steps
                  </span>
                </div>
                
                <button
                  onClick={addEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95 transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* ══════════════════════════════════════════════
                  VIEW 1: SPATIAL WORKFLOW CANVAS (VISUAL PIPELINE)
              ══════════════════════════════════════════════ */}
              {editorViewMode === "flow" && (
                <div
                  className={`relative rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-zinc-950 text-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isCanvasMaximized ? "h-[85vh] min-h-[720px]" : "h-[740px] sm:h-[800px]"
                  }`}
                >
                  {/* Soft Radial Vignette */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.6)_100%)] z-10"
                  />

                  {/* ─── Canvas HUD Toolbar (Pinned at Top) ─── */}
                  <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-zinc-900/90 backdrop-blur-md px-4 py-3 sm:px-6 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-bold tracking-wide text-white">Live Workflow Canvas</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {attachedPage ? emailsWithBody.length + 1 : emailsWithBody.length} Nodes
                      </span>
                      <span className="hidden xl:inline text-[11px] text-zinc-400">
                        • Scroll or pan canvas • Hover connectors to insert steps
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Zoom Controls */}
                      <div className="flex items-center rounded-lg border border-white/10 bg-zinc-800/80 p-0.5">
                        <button
                          type="button"
                          onClick={() => setCanvasZoom((z) => Math.max(70, z - 10))}
                          aria-label="Zoom out"
                          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasZoom(100)}
                          className="px-2 text-[10px] font-mono font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Reset zoom to 100%"
                        >
                          {canvasZoom}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasZoom((z) => Math.min(130, z + 10))}
                          aria-label="Zoom in"
                          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Recenter Viewport Button */}
                      <button
                        type="button"
                        onClick={recenterCanvas}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        title="Recenter canvas position"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Recenter</span>
                      </button>

                      {/* Maximize / Focus Studio Button */}
                      <button
                        type="button"
                        onClick={() => setIsCanvasMaximized(!isCanvasMaximized)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                          isCanvasMaximized
                            ? "border-[#38BDF8]/40 bg-[#38BDF8]/15 text-[#38BDF8]"
                            : "border-white/10 bg-zinc-800/80 text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                        title={isCanvasMaximized ? "Exit full studio" : "Expand to studio mode"}
                      >
                        {isCanvasMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{isCanvasMaximized ? "Collapse" : "Focus"}</span>
                      </button>

                      {/* Toggle Inspector Button */}
                      <button
                        type="button"
                        onClick={() => setShowCanvasInspector(!showCanvasInspector)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                          showCanvasInspector
                            ? "border-[#38BDF8]/50 bg-[#38BDF8]/20 text-[#38BDF8]"
                            : "border-white/10 bg-zinc-800/80 text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Inspector</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── Canvas Workspace Body (Split Stage) ─── */}
                  <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                    
                    {/* Left: Infinite Interactive Canvas Viewport */}
                    <div
                      ref={canvasViewportRef}
                      onMouseDown={handleCanvasMouseDown}
                      className={`flex-1 h-full overflow-hidden relative select-none ${
                        isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"
                      }`}
                    >
                      {/* Infinite Dynamic Dot Matrix Grid */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none opacity-25"
                        style={{
                          backgroundImage: "radial-gradient(circle at 1.5px 1.5px, #ffffff 1.2px, transparent 0)",
                          backgroundSize: `${22 * (canvasZoom / 100)}px ${22 * (canvasZoom / 100)}px`,
                          backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px`,
                        }}
                      />

                      {/* Floating Canvas Navigation Hint Pill */}
                      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/90 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-zinc-400 shadow-lg">
                          <Move className="h-3 w-3 text-[#38BDF8]" />
                          <span>Drag anywhere to pan • Scroll to navigate • Pinch to zoom</span>
                        </div>
                      </div>

                      {/* Pannable & Scalable Nodes Content Stage */}
                      <div
                        className="relative p-6 sm:p-10 flex flex-col items-center min-w-[360px] will-change-transform"
                        style={{
                          transform: `translate3d(${canvasPan.x}px, ${canvasPan.y}px, 0) scale(${canvasZoom / 100})`,
                          transformOrigin: "top center",
                          transition: isDraggingCanvas ? "none" : "transform 0.15s ease-out",
                        }}
                      >
                        {/* ═══ NODE 0: ENTRY TRIGGER ═══ */}
                        <div className="group relative w-full max-w-[440px]">
                          {/* Top Port Decorator */}
                          <div className="flex justify-center -mb-2 relative z-10">
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-950/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#38BDF8] shadow-sm">
                              <Zap className="h-2.5 w-2.5" />
                              Trigger
                            </span>
                          </div>

                          <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-zinc-900/90 to-zinc-900/90 p-4 shadow-xl backdrop-blur-md transition hover:border-blue-500/50">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066B2] to-[#38BDF8] text-white shadow-md shadow-blue-500/20">
                                  <Zap className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                                    Audience Opt-in
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                                    {attachedPage ? `Via ${attachedPage.name}` : "User Subscribed"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-sm font-mono font-bold text-white tabular-nums">
                                  {signedUp.toLocaleString()}
                                </span>
                                <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                  Enrolled
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Output Port */}
                          <div className="flex justify-center -mt-1.5 relative z-10">
                            <span className="h-3 w-3 rounded-full border-2 border-blue-400 bg-zinc-950 ring-4 ring-zinc-900" />
                          </div>
                        </div>

                        {/* ─── CONNECTOR: Trigger to First Step ─── */}
                        <div className="relative flex flex-col items-center my-1 group">
                          {/* Vertical Stem */}
                          <div className="w-0.5 h-12 bg-gradient-to-b from-blue-400 via-zinc-700 to-zinc-700" />

                          {/* Timing Capsule */}
                          <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/95 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 shadow-sm backdrop-blur-sm group-hover:border-[#38BDF8]/40 transition">
                            <Clock className="h-2.5 w-2.5 text-[#38BDF8]" />
                            <span>Sends instantly</span>
                          </div>

                          {/* Quick-Insert + Button on Hover */}
                          <button
                            type="button"
                            onClick={() => insertEmailAt(0)}
                            className="opacity-0 group-hover:opacity-100 absolute top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8] text-[#06243A] shadow-lg shadow-cyan-500/40 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                            title="Insert step here"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>

                        {/* ═══ NODE: Instant Resource Delivery (if attached) ═══ */}
                        {attachedPage && (
                          <>
                            <div className="group relative w-full max-w-[440px]">
                              {/* Top Input Port */}
                              <div className="flex justify-center -mb-1.5 relative z-10">
                                <span className="h-3 w-3 rounded-full border-2 border-emerald-400 bg-zinc-950 ring-4 ring-zinc-900" />
                              </div>

                              <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-zinc-900/90 to-zinc-900/90 p-4 shadow-xl backdrop-blur-md transition hover:border-emerald-500/50">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold text-xs">
                                      1
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                          Resource Delivery
                                        </span>
                                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                                          Instant
                                        </span>
                                      </div>
                                      <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                                        {attachedPage.deliveryEmail?.subject || "Your requested access is inside"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
                                    <div>
                                      <span className="block text-xs font-mono font-bold text-white tabular-nums">
                                        {signedUp.toLocaleString()}
                                      </span>
                                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                        Sent
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-xs font-mono font-bold text-emerald-400 tabular-nums">
                                        {overallOpenRate}%
                                      </span>
                                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                        Open
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Output Port */}
                              <div className="flex justify-center -mt-1.5 relative z-10">
                                <span className="h-3 w-3 rounded-full border-2 border-emerald-400 bg-zinc-950 ring-4 ring-zinc-900" />
                              </div>
                            </div>

                            {/* Connector to First Follow-up */}
                            <div className="relative flex flex-col items-center my-1 group">
                              <div className="w-0.5 h-12 bg-zinc-700" />
                              {emailsWithBody[0] && (
                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/95 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 shadow-sm group-hover:border-[#38BDF8]/40 transition">
                                  <Clock className="h-2.5 w-2.5 text-zinc-400" />
                                  <span>Wait {emailsWithBody[0].delayLabel || "1 day"}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => insertEmailAt(0)}
                                className="opacity-0 group-hover:opacity-100 absolute top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8] text-[#06243A] shadow-lg shadow-cyan-500/40 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                                title="Insert step here"
                              >
                                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </>
                        )}

                        {/* ═══ NODES: Drip Follow-up Email Steps ═══ */}
                        {emailsWithBody.map((email, idx) => {
                          const isSelected = selectedFlowNodeIndex === idx;
                          const stepNum = attachedPage ? idx + 2 : idx + 1;
                          const sentCount = email.sent || 0;
                          const openedCount = email.opened || 0;
                          const stepOpenRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;

                          const mins = typeof email.delayMinutes === "number" ? email.delayMinutes : null;
                          const waitLabel =
                            mins === null
                              ? (email.delayLabel || "1 day").replace(/\s*(delay|later)$/i, "")
                              : mins <= 0
                              ? "Instantly"
                              : mins < 60
                              ? `${mins} min`
                              : mins < 1440
                              ? `${Math.round(mins / 60)} hr${Math.round(mins / 60) > 1 ? "s" : ""}`
                              : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) > 1 ? "s" : ""}`;

                          const selectThis = () => {
                            setSelectedFlowNodeIndex(idx);
                            setShowCanvasInspector(true);
                          };

                          return (
                            <div key={email.id || idx} className="w-full flex flex-col items-center">
                              {/* Drip Step Card */}
                              <div className="group relative w-full max-w-[440px]">
                                {/* Top Input Port */}
                                <div className="flex justify-center -mb-1.5 relative z-10">
                                  <span
                                    className={`h-3 w-3 rounded-full border-2 bg-zinc-950 ring-4 ring-zinc-900 transition-colors ${
                                      isSelected ? "border-[#38BDF8] ring-cyan-500/20" : "border-zinc-500"
                                    }`}
                                  />
                                </div>

                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={selectThis}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      selectThis();
                                    }
                                  }}
                                  className={`relative rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer overflow-hidden ${
                                    isSelected
                                      ? "border-2 border-[#38BDF8] bg-zinc-900/95 shadow-cyan-500/10 scale-[1.01]"
                                      : "border border-white/10 bg-zinc-900/70 hover:border-white/20 hover:bg-zinc-900/90"
                                  }`}
                                >
                                  {isSelected && (
                                    <span
                                      aria-hidden="true"
                                      className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#38BDF8] to-[#0066B2]"
                                    />
                                  )}

                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-md transition-colors ${
                                          isSelected
                                            ? "bg-[#38BDF8] text-[#06243A] shadow-cyan-500/30"
                                            : "bg-white/10 text-white"
                                        }`}
                                      >
                                        {stepNum}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            Follow-up Step
                                          </span>
                                          <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-semibold text-zinc-400">
                                            {waitLabel}
                                          </span>
                                        </div>
                                        <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                                          {email.subject || `Untitled Step ${stepNum}`}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                          {email.previewText?.trim() || "No preheader set"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
                                      <div>
                                        <span className="block text-xs font-mono font-bold text-white tabular-nums">
                                          {sentCount.toLocaleString()}
                                        </span>
                                        <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                          Sent
                                        </span>
                                      </div>
                                      <div>
                                        <span
                                          className={`block text-xs font-mono font-bold tabular-nums ${
                                            sentCount > 0 ? "text-emerald-400" : "text-zinc-500"
                                          }`}
                                        >
                                          {stepOpenRate}%
                                        </span>
                                        <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                          Open
                                        </span>
                                      </div>
                                    </div>

                                    {/* Quick Edit Action Button */}
                                    <button
                                      type="button"
                                      aria-label={`Open step ${stepNum} in full editor`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditorViewMode("list");
                                        setExpandedEmailId(email.id);
                                      }}
                                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 outline-none transition-colors hover:bg-white/10 hover:text-[#38BDF8]"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Bottom Output Port */}
                                <div className="flex justify-center -mt-1.5 relative z-10">
                                  <span
                                    className={`h-3 w-3 rounded-full border-2 bg-zinc-950 ring-4 ring-zinc-900 transition-colors ${
                                      isSelected ? "border-[#38BDF8] ring-cyan-500/20" : "border-zinc-500"
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Stem to next node */}
                              <div className="relative flex flex-col items-center my-1 group">
                                <div className="w-0.5 h-12 bg-zinc-700" />
                                
                                {idx < emailsWithBody.length - 1 && (
                                  <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/95 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 shadow-sm group-hover:border-[#38BDF8]/40 transition">
                                    <Clock className="h-2.5 w-2.5 text-zinc-400" />
                                    <span>Wait {emailsWithBody[idx + 1]?.delayLabel || "1 day"}</span>
                                  </div>
                                )}

                                {/* Quick Insert Button */}
                                <button
                                  type="button"
                                  onClick={() => insertEmailAt(idx + 1)}
                                  className="opacity-0 group-hover:opacity-100 absolute top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8] text-[#06243A] shadow-lg shadow-cyan-500/40 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                                  title="Insert step here"
                                >
                                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* ═══ NODE: TERMINAL JOURNEY COMPLETE ═══ */}
                        <div className="group relative w-full max-w-[440px]">
                          {/* Top Input Port */}
                          <div className="flex justify-center -mb-1.5 relative z-10">
                            <span className="h-3 w-3 rounded-full border-2 border-emerald-400 bg-zinc-950 ring-4 ring-zinc-900" />
                          </div>

                          <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-zinc-900/90 to-zinc-900/90 p-4 shadow-xl backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                                  <Check className="h-4 w-4 stroke-[3]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    Sequence Goal
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white">Journey Complete</p>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    Subscribers exit or stop upon conversion
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-sm font-mono font-bold text-white tabular-nums">
                                  {(seq.stats.completed || delivered).toLocaleString()}
                                </span>
                                <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
                                  Completed
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right: Docked Inspector Panel */}
                    <AnimatePresence>
                      {showCanvasInspector && emailsWithBody[selectedFlowNodeIndex] && (
                        <motion.aside
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="w-full sm:w-[380px] lg:w-[380px] max-w-full shrink-0 h-full border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl flex flex-col overflow-hidden z-20"
                        >
                          <div className="h-full overflow-y-auto p-4 sm:p-5 flex flex-col scrollbar-thin scrollbar-thumb-zinc-700 box-border">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between gap-2.5 border-b border-white/10 pb-3 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8] text-xs font-bold text-[#06243A]">
                                  {selectedFlowNodeIndex + (attachedPage ? 2 : 1)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Step Inspector</h3>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {emailsWithBody[selectedFlowNodeIndex].subject || "Untitled Step"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => sendTestEmail(emailsWithBody[selectedFlowNodeIndex].id)}
                                  disabled={sendingTestForId === emailsWithBody[selectedFlowNodeIndex].id}
                                  className="flex items-center gap-1 rounded-lg bg-[#38BDF8]/15 px-2.5 py-1 text-[11px] font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 transition cursor-pointer whitespace-nowrap"
                                  title="Send test email to your account email"
                                >
                                  {sendingTestForId === emailsWithBody[selectedFlowNodeIndex].id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  <span>Test</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowCanvasInspector(false)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
                                  title="Close inspector"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Inspector Tab Switcher */}
                            <div className="flex rounded-lg bg-zinc-800/80 p-0.5 mt-3 border border-white/5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setInspectorTab("content")}
                                className={`flex-1 py-1 text-center text-[11px] font-bold rounded transition cursor-pointer ${
                                  inspectorTab === "content"
                                    ? "bg-white/15 text-white shadow-xs"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                Content & Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => setInspectorTab("timing")}
                                className={`flex-1 py-1 text-center text-[11px] font-bold rounded transition cursor-pointer ${
                                  inspectorTab === "timing"
                                    ? "bg-white/15 text-white shadow-xs"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                Delay & Timing
                              </button>
                            </div>

                            {/* Inspector Tab: Content */}
                            {inspectorTab === "content" && (
                              <div className="mt-4 space-y-4 flex-1">
                                <div>
                                  <label
                                    htmlFor="flow-canvas-subject"
                                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400"
                                  >
                                    Email Subject Line
                                  </label>
                                  <input
                                    id="flow-canvas-subject"
                                    type="text"
                                    value={emailsWithBody[selectedFlowNodeIndex].subject || ""}
                                    onChange={(e) =>
                                      patchEmail(emailsWithBody[selectedFlowNodeIndex].id, { subject: e.target.value })
                                    }
                                    placeholder="Compelling subject line..."
                                    className="w-full rounded-xl border border-white/10 bg-zinc-800/70 p-2.5 text-xs font-semibold text-white outline-none focus:border-[#38BDF8] transition"
                                  />
                                </div>

                                <div>
                                  <label
                                    htmlFor="flow-canvas-preheader"
                                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400"
                                  >
                                    Preheader (Inbox Teaser)
                                  </label>
                                  <input
                                    id="flow-canvas-preheader"
                                    type="text"
                                    value={emailsWithBody[selectedFlowNodeIndex].previewText || ""}
                                    onChange={(e) =>
                                      patchEmail(emailsWithBody[selectedFlowNodeIndex].id, { previewText: e.target.value })
                                    }
                                    placeholder="Teaser visible in inbox before opening..."
                                    className="w-full rounded-xl border border-white/10 bg-zinc-800/70 p-2.5 text-xs font-semibold text-white outline-none focus:border-[#38BDF8] transition"
                                  />
                                </div>

                                {/* Simulated Email Client Preview Frame */}
                                <div>
                                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Email Inbox Client Mockup
                                  </span>
                                  <div className="rounded-xl border border-white/10 bg-zinc-950 overflow-hidden shadow-inner text-xs">
                                    {/* Simulated Browser / Inbox Header */}
                                    <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-3 py-2 text-[10px] text-zinc-400">
                                      <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                                        <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                                        <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                                      </div>
                                      <span className="font-mono text-zinc-500 truncate max-w-[180px]">
                                        {account?.email || "sender@magnets.com"}
                                      </span>
                                    </div>

                                    <div className="p-3.5 space-y-2 border-b border-white/5 bg-zinc-900/40 text-[11px]">
                                      <div className="flex gap-2">
                                        <span className="text-zinc-500 font-semibold">Subject:</span>
                                        <span className="font-bold text-white truncate">
                                          {emailsWithBody[selectedFlowNodeIndex].subject || "Untitled Email"}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <span className="text-zinc-500 font-semibold">To:</span>
                                        <span className="text-zinc-300">{"{first_name} <lead@example.com>"}</span>
                                      </div>
                                    </div>

                                    <div
                                      className="email-rendered-content prose prose-invert prose-sm max-w-none p-3.5 text-zinc-300 max-h-[180px] overflow-y-auto leading-relaxed"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          emailsWithBody[selectedFlowNodeIndex].body ||
                                          "<p className='italic text-zinc-500'>No email body yet. Click full editor below to edit content.</p>",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Inspector Tab: Timing */}
                            {inspectorTab === "timing" && (
                              <div className="mt-4 space-y-4 flex-1">
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Delivery Delay
                                  </label>
                                  <select
                                    value={emailsWithBody[selectedFlowNodeIndex].delayMinutes ?? 1440}
                                    onChange={(e) => {
                                      const mins = Number(e.target.value);
                                      const obj = standardDelays.find((d) => d.minutes === mins);
                                      patchEmail(emailsWithBody[selectedFlowNodeIndex].id, {
                                        delayMinutes: mins,
                                        delayLabel: obj ? obj.label : `${mins} min`,
                                      });
                                      triggerToast("Step delay updated!");
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-zinc-800/90 p-2.5 text-xs font-semibold text-white outline-none focus:border-[#38BDF8] transition cursor-pointer"
                                  >
                                    {!standardDelays.some((del) => del.minutes === (emailsWithBody[selectedFlowNodeIndex].delayMinutes ?? 1440)) && (
                                      <option
                                        value={emailsWithBody[selectedFlowNodeIndex].delayMinutes}
                                        className="bg-zinc-900 text-white font-bold"
                                      >
                                        {emailsWithBody[selectedFlowNodeIndex].delayLabel ||
                                          (emailsWithBody[selectedFlowNodeIndex].delayMinutes < 60
                                            ? `${emailsWithBody[selectedFlowNodeIndex].delayMinutes} minutes later`
                                            : emailsWithBody[selectedFlowNodeIndex].delayMinutes < 1440
                                            ? `${Math.round(emailsWithBody[selectedFlowNodeIndex].delayMinutes / 60)} hours later`
                                            : `${Math.round(emailsWithBody[selectedFlowNodeIndex].delayMinutes / 1440)} days later`)}
                                      </option>
                                    )}
                                    {standardDelays.map((del) => (
                                      <option key={del.minutes} value={del.minutes} className="bg-zinc-900 text-white">
                                        {del.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-3 text-xs text-zinc-400 space-y-2">
                                  <p className="font-bold text-white text-[11px]">Workflow Trigger Rules</p>
                                  <p className="text-[11px] leading-relaxed">
                                    This email will be sent automatically once the specified delay elapses after the prior step. If the contact unsubscribes or books a call, sending will halt immediately.
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => moveEmailUp(selectedFlowNodeIndex)}
                                    disabled={selectedFlowNodeIndex === 0}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/80 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                    <span>Move Up</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveEmailDown(selectedFlowNodeIndex)}
                                    disabled={selectedFlowNodeIndex === emailsWithBody.length - 1}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/80 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                    <span>Move Down</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Inspector Drawer Footer Actions */}
                            <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditorViewMode("list");
                                  setExpandedEmailId(emailsWithBody[selectedFlowNodeIndex].id);
                                }}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066B2] to-[#38BDF8] py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:opacity-95 transition cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Open in Full Rich Editor</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this step from the sequence?")) {
                                    removeEmail(emailsWithBody[selectedFlowNodeIndex].id, selectedFlowNodeIndex);
                                    setSelectedFlowNodeIndex(Math.max(0, selectedFlowNodeIndex - 1));
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Step</span>
                              </button>
                            </div>
                          </div>
                        </motion.aside>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  VIEW 2: LINEAR ACCORDION STEP LIST
              ══════════════════════════════════════════════ */}
              {editorViewMode === "list" && (
                <div className="space-y-0">
                
                {/* Step 1: Instant Resource Delivery Milestone Card (Only for Lead Magnet Attached Sequences) */}
                {attachedPage && (
                  <div className="rounded-2xl border border-emerald-500/30 dark:border-white/[0.08] bg-gradient-to-br from-emerald-50/80 via-white to-white dark:from-emerald-950/20 dark:via-[#171717] dark:to-[#171717] p-3.5 sm:p-5 shadow-xs dark:shadow-none transition hover:shadow-md">
                    
                    {/* Step 1 Header Row */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-600 text-xs font-extrabold text-white shadow-xs">
                          1
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                            Instant Delivery
                          </span>
                          <span className="inline-flex items-center rounded-md border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-100/80 dark:bg-emerald-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                            On Signup
                          </span>
                        </div>
                      </div>

                      {/* Step 1 Performance Stats Pill */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-[#121212] px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="h-3 w-3 shrink-0" />
                            <span>{delivered.toLocaleString()} Sent</span>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                            <Eye className="h-3 w-3 shrink-0" />
                            <span>{overallOpenRate}% Open</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Inner Delivery Details Box */}
                    <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-[#121212] rounded-xl p-3 sm:p-3.5 border border-emerald-100 dark:border-white/10">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Resource Delivery Email
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                          {attachedPage.emailSubject || `Here is your requested resource: ${attachedPage.name || "Download"}`}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          Dispatched immediately to deliver the file link upon form submission.
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/leadmagnets/edit/${attachedPage.id}?tab=delivery`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0"
                      >
                        <span>Edit Delivery Template</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Empty State for Standalone Sequences with 0 steps */}
                {!attachedPage && emailsWithBody.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-[#171717]/50 p-8 text-center space-y-3">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0066B2] dark:text-[#38BDF8]">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Email Steps in Sequence</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Add your first welcome or trigger email to start building this standalone drip campaign.
                      </p>
                    </div>
                    <button
                      onClick={addEmail}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005291] transition shadow-xs cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Initial Welcome Email</span>
                    </button>
                  </div>
                )}

                {/* Drip Follow-up / Step Cards with Left-Aligned Flow Connectors */}
                {emailsWithBody.map((email, i) => {
                  const isExpanded = expandedEmailId === email.id;
                  const currentTab = activeTab[email.id] || "edit";
                  const openPercentage = email.sent > 0 ? Math.round((email.opened / email.sent) * 100) : 0;
                  const isCustomDelay = !standardDelays.some((d) => d.minutes === email.delayMinutes);
                  const stepNumber = attachedPage ? i + 2 : i + 1;
                  const isInitialStandaloneStep = !attachedPage && i === 0;
                  const stepLabel = attachedPage 
                    ? `Follow-up #${i + 1}` 
                    : (i === 0 ? "Initial Email" : `Follow-up #${i}`);
                  const showFlowConnector = attachedPage || i > 0;

                  return (
                    <div key={email.id}>
                      {/* Flow Connector - Left Aligned to Step Numbers */}
                      {showFlowConnector && (
                        <div className="flex items-center gap-2 pl-6 sm:pl-8 my-2">
                          <div className="flex flex-col items-center">
                            <div className="h-2.5 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
                            <div className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" />
                            <div className="h-2.5 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8]">
                            <Clock className="h-2.5 w-2.5 shrink-0" />
                            <span>{email.delayLabel || "1 day later"}</span>
                          </span>
                        </div>
                      )}

                      <div className={`rounded-2xl border bg-white dark:bg-[#171717] dark:shadow-none p-3.5 sm:p-5 shadow-xs transition hover:shadow-md ${
                        isInitialStandaloneStep 
                          ? "border-emerald-500/30 dark:border-white/[0.08] bg-gradient-to-br from-emerald-50/30 via-white to-white dark:from-emerald-950/10 dark:via-[#171717] dark:to-[#171717]" 
                          : "border-zinc-200/90 dark:border-white/[0.08]"
                      }`}>
                        {/* Step Header */}
                        <div className="flex items-center justify-between gap-2">
                          
                          {/* Left: Step Number, Step label & Delay picker */}
                          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap min-w-0">
                            <span className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-xs font-extrabold text-white shadow-xs ${
                              isInitialStandaloneStep ? "bg-emerald-600" : "bg-[#0066B2]"
                            }`}>
                              {stepNumber}
                            </span>
                            
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                              isInitialStandaloneStep 
                                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/60" 
                                : "text-[#0066B2] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/60"
                            }`}>
                              {stepLabel}
                            </span>

                            {/* Delay Selector Pill */}
                            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121212] px-2 py-1 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                              <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
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
                                className="bg-transparent font-bold text-[11px] sm:text-xs text-zinc-900 dark:text-white outline-none cursor-pointer pr-1"
                              >
                                {isCustomDelay && (
                                  <option value={email.delayMinutes} className="bg-white dark:bg-[#171717]">
                                    {email.delayLabel || `${Math.round(email.delayMinutes / 1440)} days later`}
                                  </option>
                                )}
                                {standardDelays.map((d) => (
                                  <option key={d.minutes} value={d.minutes} className="bg-white dark:bg-[#171717]">
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Right: Step Actions (Reorder, Expand, Delete) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder Buttons */}
                            <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-lg p-0.5">
                              <button
                                disabled={i === 0}
                                onClick={() => moveEmailUp(i)}
                                title="Move step up"
                                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition"
                              >
                                <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              <button
                                disabled={i === emailsWithBody.length - 1}
                                onClick={() => moveEmailDown(i)}
                                title="Move step down"
                                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition"
                              >
                                <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                            </div>

                            {/* Expand/Collapse Chevron Button */}
                            <button
                              onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition cursor-pointer"
                              title="Toggle email editor"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {/* Delete Step Button */}
                            <button
                              aria-label="Delete email step"
                              onClick={() => removeEmail(email.id, i)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Step Performance Sub-Bar */}
                        <div className="flex items-center justify-between gap-2 pt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Eye className="h-3 w-3 shrink-0" />
                            <span>{openPercentage}% Open Rate</span>
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">
                            {email.sent.toLocaleString()} Sent · {email.opened.toLocaleString()} Opened
                          </span>
                        </div>

                        {/* Subject Line Input Row */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Subject Line *
                            </label>
                            
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              value={email.subject}
                              onChange={(e) => patchEmail(email.id, { subject: e.target.value })}
                              placeholder="Enter compelling email subject..."
                              className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121212] p-2.5 sm:p-3 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none shadow-xs"
                            />
                          </div>
                        </div>

                        {/* Preview Text Input Row */}
                        <div className="mt-2.5 space-y-1">
                          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Preview Text (Inbox Preheader)
                          </label>
                          <input
                            type="text"
                            value={email.previewText || ""}
                            onChange={(e) => patchEmail(email.id, { previewText: e.target.value })}
                            placeholder="A short teaser shown after the subject in the inbox..."
                            className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121212] p-2.5 sm:p-3 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none shadow-xs"
                          />
                        </div>

                        {/* Expandable Email Body & Preview Section */}
                        {isExpanded && (
                          <div className="mt-3 sm:mt-4 pt-3.5 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              {/* Segmented Control Tabs */}
                              <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#121212] border border-transparent dark:border-white/10">
                                <button
                                  onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "edit" }))}
                                  className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition ${
                                    currentTab === "edit"
                                      ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                  }`}
                                >
                                  Edit Body
                                </button>
                                <button
                                  onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "preview" }))}
                                  className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition ${
                                    currentTab === "preview"
                                      ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                  }`}
                                >
                                  Live Preview
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 sm:gap-2">
                                

                                {/* Send Test Email */}
                                <button
                                  onClick={() => sendTestEmail(email.id)}
                                  disabled={sendingTestForId === email.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer disabled:opacity-50"
                                  title="Send test email to your account email"
                                >
                                  {sendingTestForId === email.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                  ) : (
                                    <Send className="h-3 w-3 text-zinc-400 shrink-0" />
                                  )}
                                  <span>Send Test</span>
                                </button>
                              </div>
                            </div>

                            {/* Quick Variable Insertion Tags */}
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pt-0.5">
                              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">Insert tag:</span>
                              {["{first_name}", "{name}", ...(attachedPage ? ["{resource_link}"] : [])].map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => insertVariable(email.id, tag)}
                                  className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-white/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono text-zinc-600 dark:text-zinc-300 hover:bg-[#0066B2]/10 hover:text-[#0066B2] dark:hover:text-[#38BDF8] active:scale-95 transition cursor-pointer"
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>

                            {currentTab === "edit" ? (
                              <SequenceRichEditor
                                key={email.id}
                                initialContent={email.body || ""}
                                onChange={(html) => patchEmail(email.id, { body: html })}
                                themeMode={account?.themeMode || "light"}
                                includeResourceLink={Boolean(attachedPage)}
                              />
                            ) : (
                              <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#121212] p-3 sm:p-4 text-xs space-y-3">
                                <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 pb-2 flex justify-between items-center gap-2 border-b border-zinc-200 dark:border-white/10">
                                  <div className="truncate">
                                    From: {account?.name || "Your Brand"} &lt;{account?.email || "hello@yourbrand.com"}&gt;
                                    <br />
                                    Subject: <span className="text-zinc-800 dark:text-zinc-200 font-bold">{email.subject}</span>
                                    {email.previewText && (
                                      <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                                        Preheader: {email.previewText}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[9px] sm:text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold shrink-0">
                                    Preview Mode
                                  </span>
                                </div>
                                <div
                                  className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed pt-1 text-xs email-rendered-content"
                                  dangerouslySetInnerHTML={{
                                    __html: (email.body || "")
                                      .replace(/\{first_name\}/g, "Alex")
                                      .replace(/\{name\}/g, "Alex")
                                      .replace(/\{resource_link\}/g, attachedPage ? `https://funnels.co.in/${account?.username || "demo"}/${attachedPage.slug}` : "https://download-resource.com")
                                  }}
                                />
                                <div className="pt-2 text-[10px] text-zinc-400 flex items-center justify-between gap-2 border-t border-zinc-200/60 dark:border-white/10">
                                  <span className="truncate">No longer want these emails? <span className="text-rose-500 underline cursor-pointer">Unsubscribe</span></span>
                                  <span className="shrink-0">Stop link attached</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Footer Info */}
                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">
                            {isExpanded ? "Editor active" : (isInitialStandaloneStep ? "Initial trigger email" : "Drip follow-up step")}
                          </span>

                          <button
                            onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                            className="text-[#0066B2] dark:text-[#38BDF8] hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            {isExpanded ? "Collapse Editor" : "Edit Body →"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Email Step Action Button */}
                <div className="pt-3">
                  <button
                    onClick={addEmail}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/10 bg-white/40 dark:bg-[#171717]/40 py-3.5 sm:py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:border-[#38BDF8] dark:hover:text-[#38BDF8] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 active:scale-[0.99] transition cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Another Email Step to {attachedPage ? "Funnel" : "Sequence"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* Right Column: Performance & Settings (4 Cols on Desktop, Stacked on Mobile) */}
            {!(isCanvasMaximized && editorViewMode === "flow") && (
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              
              {/* Performance Metrics Card */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#171717] dark:shadow-none p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span>{attachedPage ? "Funnel Performance" : "Sequence Performance"}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {overallOpenRate}% Open Rate
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Contacts Section */}
                  <div className="space-y-2">
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
                  <div className="pt-2 space-y-2">
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
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Email Engagement Rate</span>
                    <span>{overallOpenRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-[#121212] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066B2] to-emerald-400"
                      style={{ width: `${Math.min(overallOpenRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* View Leads Link */}
                <div className="pt-1">
                  <Link
                    href={`/dashboard/leads?search=${encodeURIComponent(attachedPage?.name || seq.name)}`}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                  >
                    <span>View enrolled leads ({signedUp})</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Unsubscribe & Stop Link Explanation */}
              <div className="rounded-2xl border border-blue-500/20 dark:border-white/[0.08] bg-blue-50/50 dark:bg-[#171717] dark:shadow-none p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>How Stop Links Work</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every email sent to a lead automatically includes a personal unsubscribe link at the bottom, plus one-click unsubscribe in Gmail and Yahoo. When a lead unsubscribes, their status changes to <span className="font-bold text-rose-500">Stopped</span> and they will not receive any more of your follow-up emails.
                </p>
              </div>

            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}