import { normalizeHashtagList } from "@/lib/publishing-queue-workflow";
import type { PublishingQueueEntry } from "@/types/studio";

const STORAGE_KEY = "vb-jewelry-ai.publishing-queue";

let currentSnapshot: PublishingQueueEntry[] | null = null;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizePlatform(value: unknown, fallback: PublishingQueueEntry["platform"]) {
  if (value === "Instagram Reels" || value === "Instagram Feed") {
    return value;
  }

  return fallback;
}

function normalizeStatus(
  value: unknown,
  fallback: PublishingQueueEntry["postingStatus"],
) {
  if (
    value === "Business Approved" ||
    value === "Ready to Publish" ||
    value === "Scheduled"
  ) {
    return value;
  }

  return fallback;
}

function normalizePublishingQueueItem(
  raw: unknown,
  fallback?: PublishingQueueEntry,
): PublishingQueueEntry | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<PublishingQueueEntry>;

  const contentTitle = cleanString(candidate.contentTitle, fallback?.contentTitle ?? "");
  const personaName = cleanString(candidate.personaName, fallback?.personaName ?? "");
  const productName = cleanString(candidate.productName, fallback?.productName ?? "");
  const scheduledPublishDate = cleanString(
    candidate.scheduledPublishDate,
    fallback?.scheduledPublishDate ?? "",
  );
  const caption = cleanString(candidate.caption, fallback?.caption ?? "");
  const hashtags = normalizeHashtagList(candidate.hashtags ?? fallback?.hashtags ?? []);

  if (
    !contentTitle ||
    !personaName ||
    !productName ||
    !scheduledPublishDate ||
    !caption ||
    hashtags.length === 0
  ) {
    return fallback ?? null;
  }

  return {
    id: cleanString(candidate.id, fallback?.id ?? `publishing-${contentTitle.toLowerCase()}`),
    contentTitle,
    personaName,
    productName,
    scheduledPublishDate,
    platform: normalizePlatform(candidate.platform, fallback?.platform ?? "Instagram Reels"),
    caption,
    hashtags,
    postingStatus: normalizeStatus(
      candidate.postingStatus,
      fallback?.postingStatus ?? "Business Approved",
    ),
  };
}

function normalizePublishingQueue(
  raw: unknown,
  fallback: PublishingQueueEntry[],
): PublishingQueueEntry[] {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  if (raw.length === 0) {
    return [];
  }

  const normalized = raw
    .map((item, index) => normalizePublishingQueueItem(item, fallback[index]))
    .filter((item): item is PublishingQueueEntry => item !== null);

  return normalized.length > 0 ? normalized : fallback;
}

export function subscribeToPublishingQueueStore(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getPublishingQueueSnapshot(fallback: PublishingQueueEntry[]) {
  if (currentSnapshot) {
    return currentSnapshot;
  }

  if (!canUseStorage()) {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return fallback;
  }

  try {
    currentSnapshot = normalizePublishingQueue(JSON.parse(storedValue), fallback);
    return currentSnapshot;
  } catch {
    return fallback;
  }
}

export function savePublishingQueueSnapshot(nextItems: PublishingQueueEntry[]) {
  currentSnapshot = nextItems
    .map((item) => normalizePublishingQueueItem(item))
    .filter((item): item is PublishingQueueEntry => item !== null);

  if (canUseStorage()) {
    // Local storage is the temporary mock store until real scheduling integration is added.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
  }

  listeners.forEach((listener) => listener());
}

export function resetPublishingQueueSnapshot(fallback: PublishingQueueEntry[]) {
  currentSnapshot = fallback;

  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  listeners.forEach((listener) => listener());
}
