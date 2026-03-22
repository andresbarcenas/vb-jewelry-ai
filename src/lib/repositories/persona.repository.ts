import { personaProfiles as defaultPersonas } from "@/data/mock-studio";
import { prisma } from "@/lib/prisma";
import type {
  AiPersonaProfile,
  PersonaRecommendedFor,
  PersonaStatus,
  PersonaUseCaseTag,
} from "@/types/studio";

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

function normalizeStatus(value: unknown, fallback: PersonaStatus): PersonaStatus {
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

function toDatabaseInput(persona: AiPersonaProfile) {
  return {
    id: persona.id,
    name: persona.name,
    label: persona.label,
    ageRange: persona.ageRange,
    styleVibe: persona.styleVibe,
    audienceFit: persona.audienceFit,
    bestUseCases: persona.bestUseCases,
    contentTone: persona.contentTone,
    recommendedScenes: persona.recommendedScenes,
    preferredColors: persona.preferredColors,
    jewelryFit: persona.jewelryFit,
    avoidList: persona.avoidList,
    promptStarter: persona.promptStarter,
    bestContentTypes: persona.recommendedFor.bestContentTypes,
    bestMoods: persona.recommendedFor.bestMoods,
    bestProductCategories: persona.recommendedFor.bestProductCategories,
    status: persona.status,
  };
}

function fromDatabaseOutput(raw: {
  id: string;
  name: string;
  label: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  bestUseCases: string[];
  contentTone: string;
  recommendedScenes: string[];
  preferredColors: string[];
  jewelryFit: string;
  avoidList: string[];
  promptStarter: string;
  bestContentTypes: string[];
  bestMoods: string[];
  bestProductCategories: string[];
  status: string;
}): AiPersonaProfile | null {
  return normalizePersona(
    {
      ...raw,
      recommendedFor: {
        bestContentTypes: raw.bestContentTypes,
        bestMoods: raw.bestMoods,
        bestProductCategories: raw.bestProductCategories,
      },
    },
    defaultPersonas.find((item) => item.id === raw.id),
  );
}

export async function getPersonas(): Promise<AiPersonaProfile[]> {
  const records = await prisma.persona.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (records.length === 0) {
    await prisma.persona.createMany({
      data: defaultPersonas.map(toDatabaseInput),
    });
    return defaultPersonas;
  }

  const normalized = records
    .map(fromDatabaseOutput)
    .filter((item): item is AiPersonaProfile => item !== null)
    .slice(0, MAX_PERSONAS);

  return normalizePersonas(normalized, defaultPersonas);
}

export async function createPersona(persona: AiPersonaProfile): Promise<AiPersonaProfile[]> {
  const current = await getPersonas();
  const candidate = normalizePersona(persona);

  if (!candidate || current.length >= MAX_PERSONAS) {
    return current;
  }

  const id = candidate.id || createPersonaId(candidate.name);
  await prisma.persona.upsert({
    where: {
      id,
    },
    create: toDatabaseInput({
      ...candidate,
      id,
    }),
    update: toDatabaseInput({
      ...candidate,
      id,
    }),
  });

  return getPersonas();
}

export async function updatePersona(persona: AiPersonaProfile): Promise<AiPersonaProfile[]> {
  const current = await getPersonas();
  const candidate = normalizePersona(persona);

  if (!candidate) {
    return current;
  }

  await prisma.persona.update({
    where: {
      id: candidate.id,
    },
    data: toDatabaseInput(candidate),
  });

  return getPersonas();
}

export async function deletePersona(personaId: string): Promise<AiPersonaProfile[]> {
  await prisma.persona.deleteMany({
    where: {
      id: personaId,
    },
  });

  return getPersonas();
}

export async function resetPersonas(): Promise<AiPersonaProfile[]> {
  await prisma.persona.deleteMany();
  await prisma.persona.createMany({
    data: defaultPersonas.map(toDatabaseInput),
  });
  return getPersonas();
}
