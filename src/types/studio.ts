export type StudioIconName =
  | "dashboard"
  | "brand"
  | "personas"
  | "library"
  | "ideas"
  | "review"
  | "publishing"
  | "analytics"
  | "menu"
  | "spark";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: StudioIconName;
}

export interface BrandProfile {
  brandName: string;
  brandVoice: string;
  targetCustomer: string;
  styleKeywords: string[];
  doNotUseList: string[];
  preferredColors: string[];
  productCategories: string[];
  instagramHandle: string;
}

export interface Persona {
  id: string;
  name: string;
  roleLabel: string;
  summary: string;
  tone: string;
  focus: string;
  audience: string;
  status: "Approved" | "Draft";
  pillars: string[];
  visualNotes: string[];
  sampleHook: string;
  usageShare: number;
  recommendedFor: string;
  lastUsed: string;
}

export interface ProductAsset {
  id: string;
  name: string;
  sku: string;
  collection: string;
  category: string;
  material: string;
  status: "Ready" | "Needs Review" | "Draft";
  heroTone: "champagne" | "sand" | "sage" | "blush" | "obsidian";
  formats: string[];
  tags: string[];
  featured: boolean;
  launchWindow: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  personaId: string;
  personaName: string;
  status: "Approved Concept" | "Ready for Storyboard" | "Awaiting Brand Note";
  products: string[];
  theme: string;
  concept: string;
  hook: string;
  captionAngle: string;
  priority: "High" | "Medium";
  targetLaunch: string;
}

export interface VideoReviewItem {
  id: string;
  conceptTitle: string;
  personaName: string;
  productName: string;
  editor: string;
  reviewer: string;
  status: "Needs Review" | "Changes Requested" | "Approved";
  dueDate: string;
  notes: string;
  duration: string;
}

export interface PublishingItem {
  id: string;
  title: string;
  channel: "Instagram Reels";
  scheduledFor: string;
  status: "Scheduled" | "Ready to Schedule" | "Draft";
  owner: string;
  personaName: string;
  productName: string;
  campaign: string;
}

export interface AnalyticsTrendPoint {
  label: string;
  value: number;
}

export interface AnalyticsHighlight {
  label: string;
  score: number;
  note: string;
}

export interface AnalyticsPersonaLift {
  name: string;
  lift: number;
  note: string;
}

export interface AnalyticsSnapshot {
  timeframe: string;
  views: number;
  saves: number;
  shareRate: number;
  conversionLift: number;
  topPersonas: AnalyticsPersonaLift[];
  topThemes: AnalyticsHighlight[];
  trend: AnalyticsTrendPoint[];
  notes: string[];
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  note: string;
}
