import { contentIdeas as defaultContentIdeas, videoReviewQueue as defaultVideoReviewQueue } from "@/data/mock-studio";
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
  ContentIdeaGenerationResult,
  ContentIdeaType,
  ContentIdeaGeneratorInput,
  ContentMood,
  ContentPlatform,
  VideoReviewItem,
} from "@/types/studio";

export type { ContentIdeaGenerationResult };

const VIDEO_REVIEW_KEY = "vb-jewelry-ai.service.video-review";

export interface ContentGenerationOptions {
  platforms: readonly ContentPlatform[];
  moods: readonly ContentMood[];
  contentTypes: readonly ContentIdeaType[];
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

async function requestJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

interface IdeaActionResponse {
  idea: ContentIdea;
  source?: "openai" | "mock_fallback";
  message?: string;
}

export async function listContentIdeas(): Promise<ContentIdea[]> {
  const fromApi = await requestJson<ContentIdea[]>("/api/content-ideas");
  return fromApi ?? defaultContentIdeas;
}

export async function generateIdeas(
  input: ContentIdeaGeneratorInput,
): Promise<ContentIdeaGenerationResult> {
  const fromApi = await requestJson<ContentIdeaGenerationResult>(
    "/api/content-ideas/generate",
    {
      method: "POST",
      body: JSON.stringify({
        personaId: input.persona.id,
        productId: input.product.id,
        platform: input.platform,
        mood: input.mood,
        contentType: input.contentType,
        count: 5,
      }),
    },
  );

  if (fromApi) {
    return fromApi;
  }

  return {
    ideas: [],
    source: "mock_fallback",
    message: "Generation did not complete. Please try again.",
  };
}

export async function saveContentIdea(ideaId: string): Promise<IdeaActionResponse | null> {
  return requestJson<IdeaActionResponse>(`/api/content-ideas/${ideaId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "save",
    }),
  });
}

export async function sendContentIdeaToReview(
  ideaId: string,
): Promise<IdeaActionResponse | null> {
  return markContentIdeaReadyForReview(ideaId);
}

export async function markContentIdeaReadyForReview(
  ideaId: string,
): Promise<IdeaActionResponse | null> {
  return requestJson<IdeaActionResponse>(`/api/content-ideas/${ideaId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "ready_for_review",
    }),
  });
}

export async function archiveContentIdea(ideaId: string): Promise<IdeaActionResponse | null> {
  return requestJson<IdeaActionResponse>(`/api/content-ideas/${ideaId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "archive",
    }),
  });
}

export async function regenerateContentIdea(
  ideaId: string,
): Promise<IdeaActionResponse | null> {
  return requestJson<IdeaActionResponse>(`/api/content-ideas/${ideaId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "regenerate",
    }),
  });
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
  return defaultContentIdeas;
}

export async function resetVideoReviewQueue(): Promise<VideoReviewItem[]> {
  return resetPersistedValue(VIDEO_REVIEW_KEY, defaultVideoReviewQueue);
}
