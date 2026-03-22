import type {
  PublishingPlatform,
  PublishingQueueEntry,
  PublishingStatus,
} from "@/types/studio";

export const publishingPlatformOptions: PublishingPlatform[] = [
  "Instagram Reels",
  "Instagram Feed",
];

export const publishingStatusOptions: PublishingStatus[] = [
  "Business Approved",
  "Ready to Publish",
  "Scheduled",
];

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

// This gives a future publishing API a clean payload handoff without changing the form UI.
export function buildPublishingIntegrationPayload(item: PublishingQueueEntry) {
  return {
    contentId: item.id,
    platform: item.platform,
    scheduledPublishDate: item.scheduledPublishDate,
    caption: item.caption,
    hashtags: normalizeHashtagList(item.hashtags),
  };
}

export function markPublishingItemReady(item: PublishingQueueEntry): PublishingQueueEntry {
  if (item.postingStatus !== "Business Approved") {
    return item;
  }

  return {
    ...item,
    postingStatus: "Ready to Publish",
  };
}
