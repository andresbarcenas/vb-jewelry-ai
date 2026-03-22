import type { AiPersonaProfile } from "@/types/persona";
import type { ProductLibraryItem } from "@/types/product";

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

export type ContentIdeaPriority = "High" | "Medium" | "Low";

export type ContentIdeaStatus =
  | "Generated"
  | "Saved"
  | "Ready for Review"
  | "Archived"
  | "Approved Concept"
  | "Ready for Storyboard"
  | "Awaiting Brand Note";

export interface ContentIdeaGeneratorInput {
  persona: AiPersonaProfile;
  product: ProductLibraryItem;
  platform: ContentPlatform;
  mood: ContentMood;
  contentType: ContentIdeaType;
}

export interface GeneratedContentIdeaCard {
  id: string;
  title: string;
  hook: string;
  conceptSummary: string;
  visualDirection: string;
  captionAngle: string;
  cta: string;
  priority: ContentIdeaPriority;
}

export interface ContentIdeaGenerationResult {
  ideas: ContentIdea[];
  source: "openai" | "mock_fallback";
  message: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  personaId: string;
  personaName: string;
  productId?: string;
  productName?: string;
  platform?: ContentPlatform;
  mood?: ContentMood;
  contentType?: ContentIdeaType;
  status: ContentIdeaStatus;
  products: string[];
  theme: string;
  concept: string;
  visualDirection?: string;
  hook: string;
  captionAngle: string;
  cta?: string;
  priority: ContentIdeaPriority;
  autoSaved?: boolean;
  targetLaunch: string;
  createdAt?: string;
  updatedAt?: string;
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
