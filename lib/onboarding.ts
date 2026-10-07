import type { Account, MagnetPage, Sequence, Integration } from "@/lib/data";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  ctaText: string;
  href: string;
  category: string;
  iconName: "FileText" | "Rocket" | "Mail" | "Palette" | "Sliders";
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isAllCompleted: boolean;
}

export function computeOnboardingStatus({
  pages = [],
  sequences = [],
  account = null,
  integrations = [],
}: {
  pages?: MagnetPage[];
  sequences?: Sequence[];
  account?: Account | null;
  integrations?: Integration[];
}): OnboardingStatus {
  const hasMagnets = pages.length > 0;
  const hasLiveMagnet = pages.some((p) => p.status === "live");
  const hasSequence =
    sequences.length > 0 ||
    pages.some((p) => p.sequenceEnabled && (p.sequenceEmails?.length ?? 0) > 0);
  
  const hasCustomBrand = Boolean(
    (account?.brandColor && account?.brandColor !== "#0066B2") ||
    account?.logo ||
    account?.brandName ||
    account?.customDomain
  );

  const hasEmailConnected = Boolean(
    account?.gmailOAuth?.connected ||
    (account?.customSmtp?.enabled && account?.customSmtp?.isVerified)
  );

  const steps: OnboardingStep[] = [
    {
      id: "create-magnet",
      title: "Create your first Lead Magnet",
      description: "Build a high-converting Landing Page or upload a Locked PDF to turn visitors into leads.",
      done: hasMagnets,
      ctaText: hasMagnets ? "View Magnets" : "Create Magnet",
      href: "/dashboard/landing-page",
      category: "Lead Capture",
      iconName: "FileText",
    },
    {
      id: "connect-email",
      title: "Connect your Gmail or SMTP",
      description: "Link your Gmail account or custom SMTP so automated emails and resources are sent to your leads.",
      done: hasEmailConnected,
      ctaText: hasEmailConnected ? "Connected ✓" : "Connect Gmail",
      href: "/dashboard/settings?tab=email",
      category: "Email Delivery",
      iconName: "Mail",
    },
    {
      id: "publish-live",
      title: "Publish a Lead Magnet live",
      description: "Switch your magnet to Live status and get your public shareable link.",
      done: hasLiveMagnet,
      ctaText: hasLiveMagnet ? "Manage Live" : "Go to Magnets",
      href: "/dashboard/landing-page",
      category: "Publishing",
      iconName: "Rocket",
    },
    {
      id: "email-sequence",
      title: "Set up an automated Email Sequence",
      description: "Automatically nurture new leads with instant resource delivery and follow-up emails.",
      done: hasSequence,
      ctaText: hasSequence ? "View Sequences" : "Create Sequence",
      href: "/dashboard/sequences",
      category: "Nurturing",
      iconName: "Mail",
    },
    {
      id: "brand-styling",
      title: "Customize your Brand & Logo",
      description: "Configure your primary brand color, logo, and brand name for consistent visitor trust.",
      done: hasCustomBrand,
      ctaText: hasCustomBrand ? "Edit Brand" : "Set Brand",
      href: "/dashboard/templates",
      category: "Identity",
      iconName: "Palette",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent,
    isAllCompleted,
  };
}
