import { publishingQueueEntries as defaultPublishingQueue } from "@/data/mock-studio";
import { runPublishContentJob } from "@/lib/jobs/publishContent.job";
import {
  readPersistedValue,
  resetPersistedValue,
  writePersistedValue,
} from "@/lib/services/mock-persistence";
import type {
  PublishingPlatform,
  PublishingQueueEntry,
  PublishingStatus,
} from "@/types/studio";

const STORAGE_KEY = "vb-jewelry-ai.service.publishing-queue";

export const publishingPlatformOptions: PublishingPlatform[] = [
  "Instagram Reels",
  "Instagram Feed",
];

export const publishingStatusOptions: PublishingStatus[] = [
  "Business Approved",
  "Ready to Publish",
  "Scheduled",
];

export interface PublishingIntegrationPayload {
  contentId: string;
  platform: PublishingPlatform;
  scheduledPublishDate: string;
  caption: string;
  hashtags: string[];
}

export interface PublishingOptions {
  platforms: readonly PublishingPlatform[];
  statuses: readonly PublishingStatus[];
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizePlatform(value: unknown, fallback: PublishingPlatform) {
  if (value === "Instagram Reels" || value === "Instagram Feed") {
    return value;
  }

  return fallback;
}

function normalizeStatus(value: unknown, fallback: PublishingStatus) {
  if (
    value === "Business Approved" ||
    value === "Ready to Publish" ||
    value === "Scheduled"
  ) {
    return value;
  }

  return fallback;
}

function normalizeHashtag(value: string) {
  const cleaned = value.trim().replace(/\s+/g, "");

  if (!cleaned) {
    return "";
  }

  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

export function normalizeHashtagList(value: string[] | string) {
  const items = Array.isArray(value) ? value : value.split(",");
  return items.map(normalizeHashtag).filter(Boolean);
}

function normalizePublishingItem(
  raw: unknown,
  fallback?: PublishingQueueEntry,
): PublishingQueueEntry | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<PublishingQueueEntry>;

  const normalized: PublishingQueueEntry = {
    id: cleanString(candidate.id, fallback?.id ?? ""),
    contentTitle: cleanString(candidate.contentTitle, fallback?.contentTitle ?? ""),
    personaName: cleanString(candidate.personaName, fallback?.personaName ?? ""),
    productName: cleanString(candidate.productName, fallback?.productName ?? ""),
    scheduledPublishDate: cleanString(
      candidate.scheduledPublishDate,
      fallback?.scheduledPublishDate ?? "",
    ),
    platform: normalizePlatform(candidate.platform, fallback?.platform ?? "Instagram Reels"),
    caption: cleanString(candidate.caption, fallback?.caption ?? ""),
    hashtags: normalizeHashtagList(candidate.hashtags ?? fallback?.hashtags ?? []),
    postingStatus: normalizeStatus(
      candidate.postingStatus,
      fallback?.postingStatus ?? "Business Approved",
    ),
  };

  if (
    !normalized.id ||
    !normalized.contentTitle ||
    !normalized.personaName ||
    !normalized.productName ||
    !normalized.scheduledPublishDate ||
    !normalized.caption ||
    normalized.hashtags.length === 0
  ) {
    return fallback ?? null;
  }

  return normalized;
}

function normalizePublishingQueue(raw: unknown, fallback: PublishingQueueEntry[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  if (raw.length === 0) {
    return [];
  }

  const normalized = raw
    .map((item, index) => normalizePublishingItem(item, fallback[index]))
    .filter((item): item is PublishingQueueEntry => item !== null);

  return normalized.length > 0 ? normalized : fallback;
}

async function persistQueue(nextQueue: PublishingQueueEntry[]) {
  const normalized = normalizePublishingQueue(nextQueue, defaultPublishingQueue);
  return writePersistedValue(STORAGE_KEY, normalized);
}

export function buildPublishingIntegrationPayload(
  item: PublishingQueueEntry,
): PublishingIntegrationPayload {
  return {
    contentId: item.id,
    platform: item.platform,
    scheduledPublishDate: item.scheduledPublishDate,
    caption: item.caption,
    hashtags: normalizeHashtagList(item.hashtags),
  };
}

export async function listPublishingQueue(): Promise<PublishingQueueEntry[]> {
  return readPersistedValue(
    STORAGE_KEY,
    defaultPublishingQueue,
    normalizePublishingQueue,
  );
}

export async function savePublishingItem(
  item: PublishingQueueEntry,
): Promise<PublishingQueueEntry[]> {
  const current = await listPublishingQueue();
  const candidate = normalizePublishingItem(item);

  if (!candidate) {
    return current;
  }

  return persistQueue(
    current.map((entry) => (entry.id === candidate.id ? candidate : entry)),
  );
}

export async function markReadyToPublish(itemId: string): Promise<PublishingQueueEntry[]> {
  const current = await listPublishingQueue();

  return persistQueue(
    current.map((entry) =>
      entry.id === itemId && entry.postingStatus === "Business Approved"
        ? {
            ...entry,
            postingStatus: "Ready to Publish",
          }
        : entry,
    ),
  );
}

export async function attemptPublish(itemId: string): Promise<{
  queue: PublishingQueueEntry[];
  result: Awaited<ReturnType<typeof runPublishContentJob>> | null;
}> {
  const current = await listPublishingQueue();
  const item = current.find((entry) => entry.id === itemId);

  if (!item) {
    return {
      queue: current,
      result: null,
    };
  }

  const result = await runPublishContentJob({ item });

  if (result.status !== "success") {
    return {
      queue: current,
      result,
    };
  }

  const queue = await persistQueue(
    current.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            postingStatus: "Scheduled",
          }
        : entry,
    ),
  );

  return {
    queue,
    result,
  };
}

export async function getPublishingOptions(): Promise<PublishingOptions> {
  return {
    platforms: publishingPlatformOptions,
    statuses: publishingStatusOptions,
  };
}

export async function resetPublishingQueue(): Promise<PublishingQueueEntry[]> {
  return resetPersistedValue(STORAGE_KEY, defaultPublishingQueue);
}
