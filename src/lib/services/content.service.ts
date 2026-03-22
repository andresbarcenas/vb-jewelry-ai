import { contentIdeas as defaultContentIdeas, videoReviewQueue as defaultVideoReviewQueue } from "@/data/mock-studio";
import { runGenerateContentJob } from "@/lib/jobs/generateContent.job";
import { runGenerateVideoJob } from "@/lib/jobs/generateVideo.job";
import { runReviewContentJob } from "@/lib/jobs/reviewContent.job";
import {
  contentMoodOptions,
  contentPlatformOptions,
  contentTypeOptions,
} from "@/lib/services/ai.service";
import {
  readPersistedValue,
  resetPersistedValue,
  writePersistedValue,
} from "@/lib/services/mock-persistence";
import type {
  ContentIdea,
  ContentIdeaType,
  ContentIdeaGeneratorInput,
  ContentMood,
  ContentPlatform,
  GeneratedContentIdeaCard,
  VideoReviewItem,
} from "@/types/studio";

const CONTENT_IDEAS_KEY = "vb-jewelry-ai.service.content-ideas";
const VIDEO_REVIEW_KEY = "vb-jewelry-ai.service.video-review";

export interface ContentGenerationOptions {
  platforms: readonly ContentPlatform[];
  moods: readonly ContentMood[];
  contentTypes: readonly ContentIdeaType[];
}

function cloneIdeas(raw: unknown, fallback: ContentIdea[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  return raw as ContentIdea[];
}

function cloneVideoQueue(raw: unknown, fallback: VideoReviewItem[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  return raw as VideoReviewItem[];
}

async function persistVideoReviewQueue(items: VideoReviewItem[]) {
  return writePersistedValue(VIDEO_REVIEW_KEY, items);
}

export async function listContentIdeas(): Promise<ContentIdea[]> {
  return readPersistedValue(CONTENT_IDEAS_KEY, defaultContentIdeas, cloneIdeas);
}

export async function generateIdeas(
  input: ContentIdeaGeneratorInput,
): Promise<GeneratedContentIdeaCard[]> {
  const result = await runGenerateContentJob(input, 5);
  return result.data;
}

export async function listVideoReviewQueue(): Promise<VideoReviewItem[]> {
  return readPersistedValue(VIDEO_REVIEW_KEY, defaultVideoReviewQueue, cloneVideoQueue);
}

export async function approveReview(
  reviewId: string,
  reviewer: string,
  notes: string,
): Promise<VideoReviewItem[]> {
  const currentQueue = await listVideoReviewQueue();

  await runReviewContentJob({
    reviewId,
    reviewer,
    notes,
    action: "approve",
  });

  return persistVideoReviewQueue(
    currentQueue.map((item) =>
      item.id === reviewId
        ? {
            ...item,
            reviewer,
            notes,
            status: "Approved",
          }
        : item,
    ),
  );
}

export async function rejectReview(
  reviewId: string,
  reviewer: string,
  notes: string,
): Promise<VideoReviewItem[]> {
  const currentQueue = await listVideoReviewQueue();

  await runReviewContentJob({
    reviewId,
    reviewer,
    notes,
    action: "reject",
  });

  return persistVideoReviewQueue(
    currentQueue.map((item) =>
      item.id === reviewId
        ? {
            ...item,
            reviewer,
            notes,
            status: "Changes Requested",
          }
        : item,
    ),
  );
}

export async function requestVideoGeneration(reviewId: string) {
  const currentQueue = await listVideoReviewQueue();
  const item = currentQueue.find((entry) => entry.id === reviewId);

  if (!item) {
    return null;
  }

  return runGenerateVideoJob({
    contentTitle: item.conceptTitle,
    personaName: item.personaName,
    productName: item.productName,
  });
}

export async function getGenerationOptions(): Promise<ContentGenerationOptions> {
  return {
    platforms: contentPlatformOptions,
    moods: contentMoodOptions,
    contentTypes: contentTypeOptions,
  };
}

export async function resetContentIdeas(): Promise<ContentIdea[]> {
  return resetPersistedValue(CONTENT_IDEAS_KEY, defaultContentIdeas);
}

export async function resetVideoReviewQueue(): Promise<VideoReviewItem[]> {
  return resetPersistedValue(VIDEO_REVIEW_KEY, defaultVideoReviewQueue);
}
