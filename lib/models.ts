import mongoose, { Schema } from "mongoose";

// Account Schema
const AccountSchema = new Schema({
  name: { type: String, required: true },
  brandName: { type: String, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, default: "" },
  plan: { type: String, default: "Free" },
  brandColor: { type: String, default: "#0066B2" },
  logo: { type: String, default: null },
  joinedAt: { type: String, required: true },
  privacyPolicy: { type: String, default: "" },
  termsOfService: { type: String, default: "" },
  themeMode: { type: String, default: "light" },
  highlightIntensity: { type: Number, default: 100 },
  templateId: { type: String, default: "template1" },
  slackWebhookUrl: { type: String, default: "" },
  zapierWebhookUrl: { type: String, default: "" },
  pipedriveApiToken: { type: String, default: "" },
  kitConnected: { type: Boolean, default: false },
  kitApiKey: { type: String, default: "" },
  senderDisplayName: { type: String, default: "" },
  senderAddress: { type: String, default: "" },
  calendarProvider: { type: String, default: "Calendly" },
  calendarToken: { type: String, default: "" },
  calendarConnected: { type: Boolean, default: false },
  leadAlertsEnabled: { type: Boolean, default: true },
  notifyEmail: { type: String, default: "" },
  avatar: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  customDomain: { type: String, default: "" },
  customSubdomain: { type: String, default: "get" },
  domainVerified: { type: Boolean, default: false },
  cnameVerified: { type: Boolean, default: false },
  sslStatus: { type: String, enum: ["pending", "active", "failed"], default: "pending" },
  ga4MeasurementId: { type: String, default: "" },
  metaPixelId: { type: String, default: "" },
  faviconUrl: { type: String, default: "" },
  ogImageUrl: { type: String, default: "" },
  spfVerified: { type: Boolean, default: false },
  dkimVerified: { type: Boolean, default: false },
  // LinkedIn Comment Automation
  linkedinWebhookSecret: { type: String, default: "" },
  linkedinConnected: { type: Boolean, default: false },
  linkedinAccountId: { type: String, default: "" },
  linkedinLiAt: { type: String, default: "" },
  linkedinJSessionId: { type: String, default: "" },
  linkedinAccountName: { type: String, default: "" },
  linkedinProfileId: { type: String, default: "" },
  linkedinProfileImage: { type: String, default: "" },
  linkedinDefaultMagnetId: { type: String, default: "" },
  linkedinTriggerWord: { type: String, default: "resource" },
  linkedinPostCampaigns: {
    type: [
      {
        postId: { type: String, required: true },
        postUrl: { type: String, default: "" },
        postText: { type: String, default: "" },
        enabled: { type: Boolean, default: true },
        magnetId: { type: String, default: "" },
        triggerWord: { type: String, default: "" },
        commentsCount: { type: Number, default: 0 },
        createdAt: { type: String, default: "" },
      },
    ],
    default: [],
  },
});

AccountSchema.index({ resetPasswordToken: 1 });

// MagnetPage Schema
const MagnetPageSchema = new Schema({
  id: { type: String, required: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: { type: String, enum: ["draft", "live", "paused"], default: "draft" },
  views: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  headline: { type: String, default: "" },
  subheadline: { type: String, default: "" },
  pitch: { type: String, default: "" },
  bullets: { type: [String], default: [] },
  imageUrl: { type: String, default: null },
  cta: { type: String, default: "Get instant access" },
  deliverable: { type: String, default: "Instant Access" },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  createdAt: { type: String, default: () => new Date().toISOString() },
  publishedAt: { type: String, default: null },
  template: { type: String, default: "template1" },
  accent: { type: String, default: "#0066B2" },
  emailSubject: { type: String, default: "" },
  emailPreviewText: { type: String, default: "" },
  emailBody: { type: String, default: "" },
  sequenceEnabled: { type: Boolean, default: false },
  stopOnCall: { type: Boolean, default: true },
  sequenceEmails: { type: Array, default: [] },
  customPromptQuestion: { type: String, default: "" },
  customPromptPlaceholder: { type: String, default: "" },
  enableAiPersonalizedDeliverable: { type: Boolean, default: false },
  testStarted: { type: Boolean, default: false },
  hasVariantB: { type: Boolean, default: false },
  variantBTitle: { type: String, default: "" },
  variantBImage: { type: String, default: null },
  variantAViews: { type: Number, default: 0 },
  variantASignups: { type: Number, default: 0 },
  variantBViews: { type: Number, default: 0 },
  variantBSignups: { type: Number, default: 0 },
  bulletsTitle: { type: String, default: "What's inside:" },
  formTitle: { type: String, default: "Instant Access" },
  formSubtitle: { type: String, default: "Where should we send your copy?" },
  namePlaceholder: { type: String, default: "Name" },
  emailPlaceholder: { type: String, default: "Email" },
  formButtonText: { type: String, default: "Send it to me" },
  customFormFields: { type: Array, default: [] },
  // Locked PDF feature fields
  pdfPages: { type: [String], default: [] },
  pdfFreePages: { type: Number, default: 2 },
  pdfTitle: { type: String, default: "" },
  pdfPageCount: { type: Number, default: 0 },
  // Explicit Asset / Deliverable fields for Landing Pages
  resourceId: { type: String, default: "" },
  assetUrl: { type: String, default: "" },
  // After Signup Flow Settings
  afterSignupOption: { type: String, enum: ["standard", "elsewhere", "custom"], default: "standard" },
  destinationUrl: { type: String, default: "" },
  customHeading: { type: String, default: "" },
  customMessage: { type: String, default: "" },
  videoUrl: { type: String, default: "" },
  buttonLabel: { type: String, default: "" },
  buttonUrl: { type: String, default: "" },
  quizFunnelEnabled: { type: Boolean, default: false },
});

MagnetPageSchema.index({ userEmail: 1, slug: 1 });
MagnetPageSchema.index({ userEmail: 1, id: 1 });

// Lead Schema
const LeadSchema = new Schema({
  id: { type: String, required: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  page: { type: String, required: true, index: true },
  pageId: { type: String, required: true, index: true },
  status: { type: String, enum: ["new", "delivered", "opened", "replied", "completed", "stopped", "pending_email", "converted"], default: "new" },
  source: { type: String, enum: ["leadmagnets", "magnets", "custom-domain", "integration", "locked-pdf-otp", "linkedin-comment"], default: "leadmagnets" },
  signedUpAt: { type: String, required: true },
  sequence: { type: String },
  sequenceStep: { type: String },
  tags: { type: [String], default: [] },
  customAnswer: { type: String, default: "" },
  customFields: { type: Schema.Types.Mixed, default: {} },
  deviceType: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
  referrer: { type: String, default: "Direct" },
  isVariantB: { type: Boolean, default: false },
});

LeadSchema.index({ userEmail: 1, pageId: 1 });
LeadSchema.index({ userEmail: 1, page: 1 });
LeadSchema.index({ userEmail: 1, email: 1 });
LeadSchema.index({ userEmail: 1, signedUpAt: -1 });

// Sequence Email Schema
const SequenceEmailSchema = new Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, default: "" },
  previewText: { type: String, default: "" },
  delayLabel: { type: String, default: "1 day" },
  delayMinutes: { type: Number, default: 1440 },
  status: { type: String, enum: ["draft", "live"], default: "draft" },
  sent: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
});

// Sequence Schema
const SequenceSchema = new Schema({
  id: { type: String, required: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  name: { type: String, required: true },
  pageId: { type: String },
  status: { type: String, enum: ["draft", "live"], default: "draft" },
  emails: { type: [SequenceEmailSchema], default: [] },
  stopOnBooking: { type: Boolean, default: false },
  stats: {
    signedUp: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    stopped: { type: Number, default: 0 },
  },
});

// Integration Schema
const IntegrationSchema = new Schema({
  id: { type: String, required: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["newsletter", "crm", "messaging", "automation", "calendar", "email"], required: true },
  description: { type: String, default: "" },
  connected: { type: Boolean, default: false },
  trigger: { type: String, default: "" },
});

// Resource Schema
const ResourceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, index: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: String, required: true },
  url: { type: String, required: true },
  fileUrl: { type: String },
  fileExt: { type: String },
});

export const ResourceModel = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

// Email Event Schema for Real-Time Telemetry & Webhooks
const EmailEventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  leadId: { type: String, index: true },
  pageId: { type: String, index: true },
  sequenceId: { type: String, index: true },
  stepId: { type: String },
  eventType: {
    type: String,
    enum: ["sent", "delivered", "opened", "clicked", "bounced", "complained"],
    required: true,
    index: true,
  },
  recipientEmail: { type: String, lowercase: true, trim: true },
  subject: { type: String, default: "" },
  linkUrl: { type: String, default: "" },
  messageId: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  ip: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: true },
});

EmailEventSchema.index({ userEmail: 1, sequenceId: 1, eventType: 1 });
EmailEventSchema.index({ userEmail: 1, leadId: 1, eventType: 1 });
EmailEventSchema.index({ pageId: 1, eventType: 1 });

export const EmailEventModel = mongoose.models.EmailEvent || mongoose.model("EmailEvent", EmailEventSchema);

// PdfOtp Schema — stores OTPs for the locked-PDF email gate.
// MongoDB TTL index auto-deletes expired records (no manual cleanup needed).
const PdfOtpSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  magnetId: { type: String, required: true },
  code: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  name: { type: String, default: "" },
  customFields: { type: Schema.Types.Mixed, default: {} },
});
PdfOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PdfOtpSchema.index({ email: 1, magnetId: 1, used: 1 });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Account;
  delete (mongoose.models as any).MagnetPage;
  delete (mongoose.models as any).Lead;
  delete (mongoose.models as any).Sequence;
  delete (mongoose.models as any).Integration;
  delete (mongoose.models as any).Resource;
  delete (mongoose.models as any).EmailEvent;
  delete (mongoose.models as any).PdfOtp;
}

export const AccountModel = mongoose.models.Account || mongoose.model("Account", AccountSchema);
export const MagnetPageModel = mongoose.models.MagnetPage || mongoose.model("MagnetPage", MagnetPageSchema);
export const LeadModel = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
export const SequenceModel = mongoose.models.Sequence || mongoose.model("Sequence", SequenceSchema);
export const IntegrationModel = mongoose.models.Integration || mongoose.model("Integration", IntegrationSchema);
export const PdfOtpModel = mongoose.models.PdfOtp || mongoose.model("PdfOtp", PdfOtpSchema);
