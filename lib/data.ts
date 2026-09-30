export interface CustomFormField {
  id: string;
  type: "text" | "select" | "textarea" | "number" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export type MagnetStatus = "draft" | "live" | "paused";

export interface MagnetPage {
  id: string;
  name: string;
  slug: string;
  status: MagnetStatus;
  views: number;
  signups: number;
  conversionRate: number;
  headline: string;
  subheadline: string;
  cta: string;
  deliverable: string;
  updatedAt: string;
  createdAt?: string;
  publishedAt: string | null;
  template: "classic" | "video" | "quiz" | "locked-pdf" | "template1" | "template2" | "template3" | "template4" | "template5" | "template6" | "template7" | "template8" | "template9" | (string & {});
  accent: string;
  imageUrl?: string | null;
  pitch?: string;
  bullets?: string[];
  emailSubject?: string;
  emailPreviewText?: string;
  emailBody?: string;
  deliveryEmail?: {
    subject?: string;
    previewText?: string;
    body?: string;
    linkText?: string;
    linkUrl?: string;
  };
  sequenceEnabled?: boolean;
  stopOnCall?: boolean;
  sequenceEmails?: { id: string; subject: string; delayDays: number; delayUnit?: "hours" | "minutes"; delayMinutes?: number; previewText?: string; body: string }[];
  afterSignupOption?: "standard" | "elsewhere" | "custom";
  destinationUrl?: string;
  customHeading?: string;
  customMessage?: string;
  videoUrl?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  quizFunnelEnabled?: boolean;
  hasVariantB?: boolean;
  testStarted?: boolean;
  variantBImage?: string | null;
  variantBTitle?: string;
  variantAViews?: number;
  variantASignups?: number;
  variantBViews?: number;
  variantBSignups?: number;
  // Feature 2: Smart Auto-Personalized Deliverable Settings
  customPromptQuestion?: string; // e.g. "What is your main business goal or bottleneck?"
  customPromptPlaceholder?: string;
  enableAiPersonalizedDeliverable?: boolean;
  bulletsTitle?: string;
  mastheadLeft?: string;
  mastheadRight?: string;
  // Editable Signup Form Card Settings
  formTitle?: string;
  formSubtitle?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  formButtonText?: string;
  userEmail?: string;
  customFormFields?: CustomFormField[];
  // Locked PDF feature fields
  pdfPages?: string[];       // Cloudinary URLs for each page image (uploaded via dashboard)
  pdfFreePages?: number;     // How many pages to show freely before the gate (default: 2)
  pdfTitle?: string;         // Title shown in the PDF viewer top bar
  pdfPageCount?: number;     // Total number of pages (stored at upload time)
  // Explicit Asset / Deliverable fields for Landing Pages
  resourceId?: string;
  assetUrl?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  page: string;
  pageId: string;
  status: "new" | "delivered" | "opened" | "replied" | "stopped" | "completed" | "pending_email" | "converted";
  opened?: boolean;
  openedSteps?: string[];
  openedAt?: string;
  source: "leadmagnets" | "magnets" | "custom-domain" | "integration" | "locked-pdf-otp" | "linkedin-comment" | "linkedin" | (string & {});
  signedUpAt: string;
  sequence?: string;
  sequenceStep?: string;
  tags: string[];
  customAnswer?: string;
  customFields?: Record<string, any>;
  deviceType?: "desktop" | "mobile";
  referrer?: string;
}

export interface SequenceEmail {
  id: string;
  subject: string;
  delayLabel: string;
  delayMinutes: number;
  status: "draft" | "live";
  sent: number;
  opened: number;
}

export interface Sequence {
  id: string;
  userEmail?: string;
  name: string;
  pageId?: string;
  status: "draft" | "live";
  emails: SequenceEmail[];
  stopOnBooking: boolean;
  stats: { signedUp: number; delivered: number; opened: number; replied: number; stopped: number; completed?: number };
}

export interface Account {
  name: string;
  brandName?: string;
  email: string;
  username: string;
  password?: string;
  plan: "Free";
  brandColor: string;
  logo: string | null;
  joinedAt: string;
  privacyPolicy?: string;
  termsOfService?: string;
  isNewAccount?: boolean;
  themeMode?: "light" | "dark";
  highlightIntensity?: number;
  templateId?: "template1" | "template2" | "template3" | "template4" | "template5" | "template6" | "template7" | string;
  slackWebhookUrl?: string;
  zapierWebhookUrl?: string;
  pipedriveApiToken?: string;
  kitConnected?: boolean;
  kitApiKey?: string;
  senderDisplayName?: string;
  senderAddress?: string;
  calendarProvider?: "Calendly" | "Cal.com";
  calendarToken?: string;
  calendarConnected?: boolean;
  leadAlertsEnabled?: boolean;
  notifyEmail?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  customDomain?: string;
  customSubdomain?: string;
  domainVerified?: boolean;
  cnameVerified?: boolean;
  sslStatus?: "pending" | "active" | "failed";
  ga4MeasurementId?: string;
  metaPixelId?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  spfVerified?: boolean;
  dkimVerified?: boolean;
  substackPublication?: string;
  // LinkedIn Comment Automation
  linkedinWebhookSecret?: string;
  linkedinConnected?: boolean;
  linkedinAccountId?: string;
  linkedinLiAt?: string;
  linkedinJSessionId?: string;
  linkedinAccountName?: string;
  linkedinProfileId?: string;
  linkedinProfileImage?: string;
  linkedinDefaultMagnetId?: string;
  linkedinTriggerWord?: string;
  linkedinPostCampaigns?: LinkedInPostCampaign[];
}

export interface LinkedInPostCampaign {
  postId: string;
  postUrl?: string;
  postText?: string;
  enabled: boolean;
  magnetId?: string;
  triggerWord?: string;
  commentsCount?: number;
  createdAt?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: "newsletter" | "crm" | "messaging" | "automation" | "calendar" | "email";
  description: string;
  connected: boolean;
  trigger: string;
}

export interface Resource {
  id: string;
  userEmail?: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
  fileUrl?: string;
  fileExt?: string;
  isPageAsset?: boolean;
  type?: string;
}

export const account: Account = {
  name: "Alex Rivera",
  email: "alex@rivera.studio",
  username: "alexrivera",
  plan: "Free",
  brandColor: "#0066B2",
  logo: null,
  joinedAt: "June 2026",
};

export const pages: MagnetPage[] = [];

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Priya Sharma",
    email: "priya@northstar.co",
    page: "The 5-Minute Content Engine",
    pageId: "p1",
    status: "opened",
    source: "leadmagnets",
    signedUpAt: "Aug 28, 2026",
    sequence: "Welcome sequence",
    sequenceStep: "Email 2 · 2 days later",
    tags: ["content", "solo"],
  },
  {
    id: "l2",
    name: "Danny Osei",
    email: "danny@forgeagency.io",
    page: "Landing on Your Feet After a Layoff",
    pageId: "p2",
    status: "replied",
    source: "custom-domain",
    signedUpAt: "Aug 28, 2026",
    sequence: "Interview warm-up",
    sequenceStep: "Email 1 · delivered",
    tags: ["job-hunt"],
  },
  {
    id: "l3",
    name: "Mia Chen",
    email: "mia@chen-studio.com",
    page: "The 5-Minute Content Engine",
    pageId: "p1",
    status: "delivered",
    source: "leadmagnets",
    signedUpAt: "Aug 27, 2026",
    sequence: "Welcome sequence",
    sequenceStep: "Email 1 · delivered",
    tags: ["content"],
  },
  {
    id: "l4",
    name: "Tom Becker",
    email: "tom@beckerhealth.com",
    page: "Landing on Your Feet After a Layoff",
    pageId: "p2",
    status: "new",
    source: "integration",
    signedUpAt: "Aug 27, 2026",
    sequence: undefined,
    sequenceStep: undefined,
    tags: ["health"],
  },
  {
    id: "l5",
    name: "Sofia Marino",
    email: "sofia@marino.design",
    page: "The 5-Minute Content Engine",
    pageId: "p1",
    status: "stopped",
    source: "leadmagnets",
    signedUpAt: "Aug 26, 2026",
    sequence: "Welcome sequence",
    sequenceStep: "Stopped · booked a call",
    tags: ["content"],
  },
  {
    id: "l6",
    name: "Noah Williams",
    email: "noah@williamsmedia.uk",
    page: "Landing on Your Feet After a Layoff",
    pageId: "p2",
    status: "opened",
    source: "leadmagnets",
    signedUpAt: "Aug 25, 2026",
    sequence: "Interview warm-up",
    sequenceStep: "Email 2 · 1 day later",
    tags: [],
  },
];

export const sequences: Sequence[] = [
  {
    id: "s1",
    name: "Welcome sequence",
    pageId: "p1",
    status: "live",
    stopOnBooking: true,
    stats: { signedUp: 962, delivered: 961, opened: 731, replied: 248, stopped: 0 },
    emails: [
      { id: "e1", subject: "Your guide is here → The 5-Minute Content Engine", delayLabel: "Instantly", delayMinutes: 0, status: "live", sent: 962, opened: 731 },
      { id: "e2", subject: "One more idea to get you started", delayLabel: "2 days later", delayMinutes: 2880, status: "live", sent: 733, opened: 402 },
      { id: "e3", subject: "The repurposing cheat sheet", delayLabel: "5 days later", delayMinutes: 7200, status: "draft", sent: 0, opened: 0 },
    ],
  },
  {
    id: "s2",
    name: "Interview warm-up",
    pageId: "p2",
    status: "live",
    stopOnBooking: true,
    stats: { signedUp: 611, delivered: 610, opened: 411, replied: 132, stopped: 4 },
    emails: [
      { id: "e4", subject: "Here's your 30-day job-hunt playbook", delayLabel: "Instantly", delayMinutes: 0, status: "live", sent: 611, opened: 411 },
      { id: "e5", subject: "3 questions every interviewer is really asking", delayLabel: "3 days later", delayMinutes: 4320, status: "live", sent: 409, opened: 210 },
    ],
  },
  {
    id: "s3",
    name: "Nurture for warm leads",
    status: "draft",
    stopOnBooking: false,
    stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0 },
    emails: [
      { id: "e6", subject: "A quick hello", delayLabel: "Instantly", delayMinutes: 0, status: "draft", sent: 0, opened: 0 },
    ],
  },
];

export const integrations: Integration[] = [
  { id: "kit", name: "Kit", category: "newsletter", description: "Send new signups to your Kit audience (Free up to 1,000 subscribers).", connected: false, trigger: "Signup" },
  { id: "slack", name: "Slack", category: "messaging", description: "Post a notification to a channel the moment someone signs up.", connected: true, trigger: "Signup" },
  { id: "pipedrive", name: "Pipedrive", category: "crm", description: "Create or update a person in Pipedrive for every signup.", connected: false, trigger: "Signup" },
  { id: "zapier", name: "Zapier", category: "automation", description: "Trigger your own automation with every new signup.", connected: true, trigger: "Signup" },
  { id: "calendly", name: "Calendly", category: "calendar", description: "Stop a follow-up sequence when someone books a call.", connected: false, trigger: "Booking" },
  { id: "calcom", name: "Cal.com", category: "calendar", description: "Stop a follow-up sequence when someone books a call.", connected: false, trigger: "Booking" },
];

export const pageStats = [
  { label: "Total views", value: "22,635", change: "+12.4%", up: true },
  { label: "Signups", value: "1,573", change: "+8.1%", up: true },
  { label: "Avg. conversion", value: "6.9%", change: "+0.4pp", up: true },
  { label: "Emails delivered", value: "1,571", change: "99.9%", up: true },
];

export function getPage(id: string) {
  return pages.find((p) => p.id === id);
}

export function getLead(id: string) {
  return leads.find((l) => l.id === id);
}

export function getSequence(id: string) {
  return sequences.find((s) => s.id === id);
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://magnets-jade.vercel.app";
}

export function getAppDomain(): string {
  const url = getAppUrl();
  return url.replace(/^https?:\/\//, "");
}