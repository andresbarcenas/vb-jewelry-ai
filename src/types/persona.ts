export type PersonaStatus = "active" | "inactive";

export type PersonaUseCaseTag =
  | "everyday"
  | "event"
  | "handmade story"
  | "modern minimal";

export type PersonaReferenceShotType =
  | "hero_portrait"
  | "three_quarter_body"
  | "side_profile"
  | "close_up_jewelry";

export type PersonaAssetStatus = "generated" | "approved";

export interface PersonaAsset {
  id: string;
  personaId: string;
  shotType: PersonaReferenceShotType;
  imageUrl: string;
  promptUsed: string;
  provider: string;
  status: PersonaAssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaRecommendedFor {
  bestContentTypes: string[];
  bestMoods: string[];
  bestProductCategories: string[];
}

export interface AiPersonaProfile {
  id: string;
  name: string;
  label: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  bestUseCases: PersonaUseCaseTag[];
  contentTone: string;
  recommendedScenes: string[];
  preferredColors: string[];
  jewelryFit: string;
  avoidList: string[];
  promptStarter: string;
  recommendedFor: PersonaRecommendedFor;
  status: PersonaStatus;
  primaryReferenceImageUrl?: string;
  referenceAssets?: PersonaAsset[];
}

export interface Persona {
  id: string;
  name: string;
  roleLabel: string;
  summary: string;
  tone: string;
  focus: string;
  audience: string;
  status: "Approved" | "Draft";
  pillars: string[];
  visualNotes: string[];
  sampleHook: string;
  usageShare: number;
  recommendedFor: string;
  lastUsed: string;
}
