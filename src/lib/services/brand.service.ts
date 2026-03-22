import { brandProfile as defaultBrandProfile } from "@/data/mock-studio";
import type { BrandProfile } from "@/types/studio";
import {
  readPersistedValue,
  resetPersistedValue,
  writePersistedValue,
} from "@/lib/services/mock-persistence";

const STORAGE_KEY = "vb-jewelry-ai.service.brand-profile";

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

export async function getBrandProfile(): Promise<BrandProfile> {
  return readPersistedValue(STORAGE_KEY, defaultBrandProfile, normalizeBrandProfile);
}

export async function saveBrandProfile(nextProfile: BrandProfile): Promise<BrandProfile> {
  const normalized = normalizeBrandProfile(nextProfile, defaultBrandProfile);
  return writePersistedValue(STORAGE_KEY, normalized);
}

export async function resetBrandProfile(): Promise<BrandProfile> {
  return resetPersistedValue(STORAGE_KEY, defaultBrandProfile);
}
