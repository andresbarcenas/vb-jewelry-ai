import type { ContentIdeaType, ContentMood, ContentPlatform } from "@/types/content";

export type AiJobType =
  | "content_generation"
  | "content_regeneration"
  | "persona_reference_pack";

export type AiJobStatus = "queued" | "processing" | "completed" | "failed";

export interface ContentGenerationJobPayload {
  personaId: string;
  productId: string;
  platform: ContentPlatform;
  mood: ContentMood;
  contentType: ContentIdeaType;
  count: number;
}

export interface PersonaReferencePackJobPayload {
  personaId: string;
}

export interface ContentRegenerationJobPayload {
  ideaId: string;
}

export type AiJobPayloadMap = {
  content_generation: ContentGenerationJobPayload;
  content_regeneration: ContentRegenerationJobPayload;
  persona_reference_pack: PersonaReferencePackJobPayload;
};

export type AiJobPayload = AiJobPayloadMap[AiJobType];

export interface AiJobRecord<TPayload = AiJobPayload> {
  id: string;
  type: AiJobType;
  status: AiJobStatus;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  message: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  availableAt?: string;
  metadata?: Record<string, unknown>;
}

export interface JobStatusResponse {
  jobId: string;
  type: AiJobType;
  status: AiJobStatus;
  attempts: number;
  maxAttempts: number;
  message: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueJobResponse {
  jobId: string;
  type: AiJobType;
  status: "queued";
  message: string;
}
