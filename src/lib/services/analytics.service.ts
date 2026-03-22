import {
  analyticsSnapshot as defaultAnalyticsSnapshot,
  dashboardStats,
  publishingQueue,
} from "@/data/mock-studio";
import { appConfig } from "@/config/app.config";
import { getBrandProfile } from "@/lib/services/brand.service";
import { listContentIdeas, listVideoReviewQueue } from "@/lib/services/content.service";
import type {
  AnalyticsSnapshot,
  BrandProfile,
  ContentIdea,
  DashboardStat,
  PublishingItem,
  VideoReviewItem,
} from "@/types/studio";

export interface SystemStatusItem {
  id: string;
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral";
}

export interface DashboardSummary {
  stats: DashboardStat[];
  upcomingPublishes: PublishingItem[];
  urgentReviews: VideoReviewItem[];
  freshIdeas: ContentIdea[];
  brandProfile: BrandProfile;
}

function getProviderLabel(status: "connected" | "not_connected", mode: "mock" | "live") {
  if (status === "not_connected") {
    return "Not Connected";
  }

  return mode === "mock" ? "Mock Connected" : "Connected";
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  return defaultAnalyticsSnapshot;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [brandProfile, ideas, reviewQueue] = await Promise.all([
    getBrandProfile(),
    listContentIdeas(),
    listVideoReviewQueue(),
  ]);

  return {
    stats: dashboardStats,
    upcomingPublishes: publishingQueue.slice(0, 3),
    urgentReviews: reviewQueue.filter((item) => item.status !== "Approved").slice(0, 3),
    freshIdeas: ideas.slice(0, 3),
    brandProfile,
  };
}

export async function getSystemStatus(): Promise<SystemStatusItem[]> {
  return [
    {
      id: "ai",
      label: "AI",
      value: getProviderLabel(appConfig.providers.ai.status, appConfig.providers.ai.mode),
      tone: appConfig.providers.ai.status === "connected" ? "success" : "warning",
    },
    {
      id: "video",
      label: "Video Engine",
      value: getProviderLabel(
        appConfig.providers.video.status,
        appConfig.providers.video.mode,
      ),
      tone: appConfig.providers.video.status === "connected" ? "success" : "warning",
    },
    {
      id: "publishing",
      label: "Publishing",
      value: getProviderLabel(
        appConfig.providers.instagram.status,
        appConfig.providers.instagram.mode,
      ),
      tone:
        appConfig.providers.instagram.status === "connected"
          ? "success"
          : "warning",
    },
  ];
}
