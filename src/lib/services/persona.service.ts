import { personaProfiles as defaultPersonas } from "@/data/mock-studio";
import type {
  AiPersonaProfile,
  PersonaRecommendedFor,
  PersonaStatus,
  PersonaUseCaseTag,
} from "@/types/studio";
import {
  readPersistedValue,
  resetPersistedValue,
  writePersistedValue,
} from "@/lib/services/mock-persistence";

const STORAGE_KEY = "vb-jewelry-ai.service.personas";
const MAX_PERSONAS = 5;
const PERSONA_USE_CASE_TAGS: PersonaUseCaseTag[] = [
  "everyday",
  "event",
  "handmade story",
  "modern minimal",
];

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeStatus(value: unknown, fallback: PersonaStatus) {
  if (value === "active" || value === "inactive") {
    return value;
  }

  if (value === "Active") {
    return "active";
  }

  if (value === "Inactive") {
    return "inactive";
  }

  return fallback;
}

function normalizeUseCaseTag(value: string): PersonaUseCaseTag | null {
  const normalized = value.trim().toLowerCase();

  return PERSONA_USE_CASE_TAGS.includes(normalized as PersonaUseCaseTag)
    ? (normalized as PersonaUseCaseTag)
    : null;
}

function cleanUseCaseTags(
  value: unknown,
  fallback: PersonaUseCaseTag[],
): PersonaUseCaseTag[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? normalizeUseCaseTag(item) : null))
        .filter((item): item is PersonaUseCaseTag => item !== null),
    ),
  );

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeRecommendedFor(
  raw: unknown,
  fallback: PersonaRecommendedFor,
): PersonaRecommendedFor {
  const candidate =
    raw && typeof raw === "object" ? (raw as Partial<PersonaRecommendedFor>) : {};

  return {
    bestContentTypes: cleanStringList(
      candidate.bestContentTypes,
      fallback.bestContentTypes,
    ),
    bestMoods: cleanStringList(candidate.bestMoods, fallback.bestMoods),
    bestProductCategories: cleanStringList(
      candidate.bestProductCategories,
      fallback.bestProductCategories,
    ),
  };
}

function normalizePersona(raw: unknown, fallback?: AiPersonaProfile): AiPersonaProfile | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<AiPersonaProfile>;
  const fallbackRecommendedFor: PersonaRecommendedFor = fallback?.recommendedFor ?? {
    bestContentTypes: ["lifestyle"],
    bestMoods: ["Elevated"],
    bestProductCategories: ["Necklaces"],
  };
  const recommendedFor = normalizeRecommendedFor(
    candidate.recommendedFor,
    fallbackRecommendedFor,
  );
  const recommendedScenes = cleanStringList(
    (candidate as Partial<AiPersonaProfile> & { scenarioExamples?: unknown })
      .recommendedScenes ??
      (candidate as Partial<AiPersonaProfile> & { scenarioExamples?: unknown })
        .scenarioExamples,
    fallback?.recommendedScenes ?? [],
  );

  const normalized: AiPersonaProfile = {
    id: cleanString(candidate.id, fallback?.id ?? ""),
    name: cleanString(candidate.name, fallback?.name ?? ""),
    label: cleanString(
      candidate.label,
      fallback?.label ?? `${cleanString(candidate.name, "Persona")} profile`,
    ),
    ageRange: cleanString(candidate.ageRange, fallback?.ageRange ?? ""),
    styleVibe: cleanString(candidate.styleVibe, fallback?.styleVibe ?? ""),
    audienceFit: cleanString(candidate.audienceFit, fallback?.audienceFit ?? ""),
    bestUseCases: cleanUseCaseTags(candidate.bestUseCases, fallback?.bestUseCases ?? [
      "everyday",
    ]),
    contentTone: cleanString(candidate.contentTone, fallback?.contentTone ?? ""),
    recommendedScenes,
    preferredColors: cleanStringList(
      candidate.preferredColors,
      fallback?.preferredColors ?? [],
    ),
    jewelryFit: cleanString(candidate.jewelryFit, fallback?.jewelryFit ?? ""),
    avoidList: cleanStringList(candidate.avoidList, fallback?.avoidList ?? []),
    promptStarter: cleanString(candidate.promptStarter, fallback?.promptStarter ?? ""),
    recommendedFor,
    status: normalizeStatus(candidate.status, fallback?.status ?? "active"),
  };

  if (
    !normalized.id ||
    !normalized.name ||
    !normalized.label ||
    !normalized.ageRange ||
    !normalized.styleVibe ||
    !normalized.audienceFit ||
    normalized.bestUseCases.length === 0 ||
    !normalized.contentTone ||
    normalized.recommendedScenes.length === 0 ||
    normalized.preferredColors.length === 0 ||
    !normalized.jewelryFit ||
    normalized.avoidList.length === 0 ||
    !normalized.promptStarter ||
    normalized.recommendedFor.bestContentTypes.length === 0 ||
    normalized.recommendedFor.bestMoods.length === 0 ||
    normalized.recommendedFor.bestProductCategories.length === 0
  ) {
    return fallback ?? null;
  }

  return normalized;
}

function normalizePersonas(raw: unknown, fallback: AiPersonaProfile[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  if (raw.length === 0) {
    return [];
  }

  const normalized = raw
    .map((item, index) => normalizePersona(item, fallback[index]))
    .filter((item): item is AiPersonaProfile => item !== null)
    .slice(0, MAX_PERSONAS);

  return normalized.length > 0 ? normalized : fallback;
}

function createPersonaId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `persona-${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

async function persistPersonas(nextPersonas: AiPersonaProfile[]) {
  const normalized = normalizePersonas(nextPersonas, defaultPersonas);
  return writePersistedValue(STORAGE_KEY, normalized);
}

export async function listPersonas(): Promise<AiPersonaProfile[]> {
  return readPersistedValue(STORAGE_KEY, defaultPersonas, normalizePersonas);
}

export async function createPersona(persona: AiPersonaProfile): Promise<AiPersonaProfile[]> {
  const current = await listPersonas();
  const candidate = normalizePersona(persona);

  if (!candidate || current.length >= MAX_PERSONAS) {
    return current;
  }

  return persistPersonas([
    ...current,
    {
      ...candidate,
      id: candidate.id || createPersonaId(candidate.name),
    },
  ]);
}

export async function updatePersona(persona: AiPersonaProfile): Promise<AiPersonaProfile[]> {
  const current = await listPersonas();
  const candidate = normalizePersona(persona);

  if (!candidate) {
    return current;
  }

  return persistPersonas(
    current.map((item) => (item.id === candidate.id ? candidate : item)),
  );
}

export async function deletePersona(personaId: string): Promise<AiPersonaProfile[]> {
  const current = await listPersonas();
  return persistPersonas(current.filter((item) => item.id !== personaId));
}

export async function resetPersonas(): Promise<AiPersonaProfile[]> {
  return resetPersistedValue(STORAGE_KEY, defaultPersonas);
}
