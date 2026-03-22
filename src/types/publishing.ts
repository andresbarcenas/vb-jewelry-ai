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
