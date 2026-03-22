import type { AiPersonaProfile } from "@/types/studio";

const STORAGE_KEY = "vb-jewelry-ai.persona-profiles";
const MAX_PERSONAS = 5;

let currentSnapshot: AiPersonaProfile[] | null = null;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

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

function normalizePersona(
  raw: unknown,
  fallback?: AiPersonaProfile,
): AiPersonaProfile | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<AiPersonaProfile>;

  const name = cleanString(candidate.name, fallback?.name ?? "");
  const ageRange = cleanString(candidate.ageRange, fallback?.ageRange ?? "");
  const styleVibe = cleanString(candidate.styleVibe, fallback?.styleVibe ?? "");
  const audienceFit = cleanString(candidate.audienceFit, fallback?.audienceFit ?? "");
  const scenarioExamples = cleanStringList(
    candidate.scenarioExamples,
    fallback?.scenarioExamples ?? [],
  );

  if (!name || !ageRange || !styleVibe || !audienceFit || scenarioExamples.length === 0) {
    return fallback ?? null;
  }

  return {
    id: cleanString(candidate.id, fallback?.id ?? `persona-${name.toLowerCase()}`),
    name,
    ageRange,
    styleVibe,
    audienceFit,
    scenarioExamples,
    status: normalizeStatus(candidate.status, fallback?.status ?? "Active"),
  };
}

function normalizePersonaProfiles(
  raw: unknown,
  fallback: AiPersonaProfile[],
): AiPersonaProfile[] {
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

export function subscribeToPersonaStore(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getPersonaProfilesSnapshot(fallback: AiPersonaProfile[]) {
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
    currentSnapshot = normalizePersonaProfiles(JSON.parse(storedValue), fallback);
    return currentSnapshot;
  } catch {
    return fallback;
  }
}

export function savePersonaProfilesSnapshot(nextProfiles: AiPersonaProfile[]) {
  currentSnapshot = nextProfiles
    .map((profile) => normalizePersona(profile))
    .filter((item): item is AiPersonaProfile => item !== null)
    .slice(0, MAX_PERSONAS);

  if (canUseStorage()) {
    // Local storage is the temporary mock store until persona management gets a real backend.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
  }

  listeners.forEach((listener) => listener());
}

export function resetPersonaProfilesSnapshot(fallback: AiPersonaProfile[]) {
  currentSnapshot = fallback;

  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  listeners.forEach((listener) => listener());
}
