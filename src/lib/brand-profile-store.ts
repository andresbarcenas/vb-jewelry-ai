import type { BrandProfile } from "@/types/studio";

const STORAGE_KEY = "vb-jewelry-ai.brand-profile";

let currentSnapshot: BrandProfile | null = null;
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

export function subscribeToBrandProfileStore(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBrandProfileSnapshot(fallback: BrandProfile) {
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
    currentSnapshot = normalizeBrandProfile(JSON.parse(storedValue), fallback);
    return currentSnapshot;
  } catch {
    return fallback;
  }
}

export function saveBrandProfileSnapshot(nextProfile: BrandProfile) {
  currentSnapshot = {
    ...nextProfile,
    brandName: nextProfile.brandName.trim(),
    brandVoice: nextProfile.brandVoice.trim(),
    targetCustomer: nextProfile.targetCustomer.trim(),
    styleKeywords: cleanStringList(nextProfile.styleKeywords, []),
    doNotUseList: cleanStringList(nextProfile.doNotUseList, []),
    preferredColors: cleanStringList(nextProfile.preferredColors, []),
    productCategories: cleanStringList(nextProfile.productCategories, []),
    instagramHandle: ensureHandle(nextProfile.instagramHandle.trim()),
  };

  if (canUseStorage()) {
    // Local storage is the temporary mock store until this section gets a real backend.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
  }

  listeners.forEach((listener) => listener());
}

export function resetBrandProfileSnapshot(fallback: BrandProfile) {
  currentSnapshot = fallback;

  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  listeners.forEach((listener) => listener());
}
