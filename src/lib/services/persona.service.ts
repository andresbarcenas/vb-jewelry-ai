import { personaProfiles as defaultPersonas } from "@/data/mock-studio";
import type { AiPersonaProfile } from "@/types/studio";
import {
  readPersistedValue,
  resetPersistedValue,
  writePersistedValue,
} from "@/lib/services/mock-persistence";

const STORAGE_KEY = "vb-jewelry-ai.service.personas";
const MAX_PERSONAS = 5;

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

function normalizeStatus(value: unknown, fallback: AiPersonaProfile["status"]) {
  if (value === "Active" || value === "Inactive") {
    return value;
  }

  return fallback;
}

function normalizePersona(raw: unknown, fallback?: AiPersonaProfile): AiPersonaProfile | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<AiPersonaProfile>;

  const normalized: AiPersonaProfile = {
    id: cleanString(candidate.id, fallback?.id ?? ""),
    name: cleanString(candidate.name, fallback?.name ?? ""),
    ageRange: cleanString(candidate.ageRange, fallback?.ageRange ?? ""),
    styleVibe: cleanString(candidate.styleVibe, fallback?.styleVibe ?? ""),
    audienceFit: cleanString(candidate.audienceFit, fallback?.audienceFit ?? ""),
    scenarioExamples: cleanStringList(
      candidate.scenarioExamples,
      fallback?.scenarioExamples ?? [],
    ),
    status: normalizeStatus(candidate.status, fallback?.status ?? "Active"),
  };

  if (
    !normalized.id ||
    !normalized.name ||
    !normalized.ageRange ||
    !normalized.styleVibe ||
    !normalized.audienceFit ||
    normalized.scenarioExamples.length === 0
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
