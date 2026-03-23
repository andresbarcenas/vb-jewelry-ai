export type VideoAssetStatus = "draft" | "generating" | "ready" | "approved";

export interface VideoAsset {
  id: string;
  contentIdeaId: string;
  status: VideoAssetStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  generationNotes: string;
  provider: string;
  createdAt?: string;
  updatedAt?: string;
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
