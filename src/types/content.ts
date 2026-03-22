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
