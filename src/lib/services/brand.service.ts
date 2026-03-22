import { brandProfile as defaultBrandProfile } from "@/data/mock-studio";
import type { BrandProfile } from "@/types/studio";

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

function ensureHandle(value: string) {
  if (!value) {
    return "";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

function normalizeBrandProfile(raw: unknown, fallback: BrandProfile): BrandProfile {
  const candidate =
    raw && typeof raw === "object" ? (raw as Partial<BrandProfile>) : {};

  return {
    brandName: cleanString(candidate.brandName, fallback.brandName),
    brandVoice: cleanString(candidate.brandVoice, fallback.brandVoice),
    targetCustomer: cleanString(candidate.targetCustomer, fallback.targetCustomer),
    styleKeywords: cleanStringList(candidate.styleKeywords, fallback.styleKeywords),
    doNotUseList: cleanStringList(candidate.doNotUseList, fallback.doNotUseList),
    preferredColors: cleanStringList(candidate.preferredColors, fallback.preferredColors),
    productCategories: cleanStringList(
      candidate.productCategories,
      fallback.productCategories,
    ),
    instagramHandle: ensureHandle(
      cleanString(candidate.instagramHandle, fallback.instagramHandle),
    ),
  };
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getBrandProfile(): Promise<BrandProfile> {
  const fromApi = await requestJson<BrandProfile>("/api/brand");

  if (fromApi) {
    return normalizeBrandProfile(fromApi, defaultBrandProfile);
  }

  return defaultBrandProfile;
}

export async function updateBrandProfile(nextProfile: BrandProfile): Promise<BrandProfile> {
  const normalized = normalizeBrandProfile(nextProfile, defaultBrandProfile);
  const fromApi = await requestJson<BrandProfile>("/api/brand", {
    method: "PUT",
    body: JSON.stringify(normalized),
  });

  if (fromApi) {
    return normalizeBrandProfile(fromApi, defaultBrandProfile);
  }

  return normalized;
}

// Backward-compatible alias while older UI imports are phased out.
export const saveBrandProfile = updateBrandProfile;

export async function resetBrandProfile(): Promise<BrandProfile> {
  const fromApi = await requestJson<BrandProfile>("/api/brand/reset", {
    method: "POST",
  });

  if (fromApi) {
    return normalizeBrandProfile(fromApi, defaultBrandProfile);
  }

  return defaultBrandProfile;
}
