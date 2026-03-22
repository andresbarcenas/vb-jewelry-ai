export type StudioIconName =
  | "dashboard"
  | "guide"
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

export interface AiPersonaProfile {
  id: string;
  name: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  scenarioExamples: string[];
  status: "Active" | "Inactive";
}

export interface ProductLibraryItem {
  id: string;
  productName: string;
  category: string;
  material: string;
  color: string;
  styleTags: string[];
  productNotes: string;
  imageDataUrl: string | null;
  imageName: string;
}

export type ContentPlatform = "Instagram Reels";

export type ContentMood =
  | "Elevated"
  | "Romantic"
  | "Warm"
  | "Editorial"
  | "Playful"
  | "Minimal";

export type ContentIdeaType =
  | "lifestyle"
  | "luxury"
  | "casual"
  | "story"
  | "gift idea"
  | "trendy";

export interface ContentIdeaGeneratorInput {
  persona: AiPersonaProfile;
  product: ProductLibraryItem;
  platform: ContentPlatform;
  mood: ContentMood;
  contentType: ContentIdeaType;
}

export interface GeneratedContentIdeaCard {
  id: string;
  hook: string;
  conceptSummary: string;
  visualDirection: string;
  captionIdea: string;
  cta: string;
}

export type PublishingPlatform = "Instagram Reels" | "Instagram Feed";

export type PublishingStatus =
  | "Business Approved"
  | "Ready to Publish"
  | "Scheduled";

export interface PublishingQueueEntry {
  id: string;
  contentTitle: string;
  personaName: string;
  productName: string;
  scheduledPublishDate: string;
  platform: PublishingPlatform;
  caption: string;
  hashtags: string[];
  postingStatus: PublishingStatus;
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
  helper?: string;
}

export interface AnalyticsContentTypePerformance {
  label: string;
  engagementRate: number;
  approvedPosts: number;
  note: string;
}

export interface AnalyticsPersonaPerformance {
  name: string;
  engagementRate: number;
  approvedPosts: number;
  note: string;
}

export interface AnalyticsSnapshot {
  timeframe: string;
  totalPosts: number;
  approvedPosts: number;
  engagementRate: number;
  bestPersona: string;
  bestContentType: string;
  weeklyPostVolume: AnalyticsTrendPoint[];
  personaPerformance: AnalyticsPersonaPerformance[];
  contentTypePerformance: AnalyticsContentTypePerformance[];
  insights: string[];
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  note: string;
}
