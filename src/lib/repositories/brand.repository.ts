import { brandProfile as defaultBrandProfile } from "@/data/mock-studio";
import { prisma } from "@/lib/prisma";
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

export async function getBrandProfile(): Promise<BrandProfile> {
  const current = await prisma.brand.findFirst({
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!current) {
    return saveBrandProfile(defaultBrandProfile);
  }

  return normalizeBrandProfile(current, defaultBrandProfile);
}

export async function saveBrandProfile(profile: BrandProfile): Promise<BrandProfile> {
  const normalized = normalizeBrandProfile(profile, defaultBrandProfile);
  const existing = await prisma.brand.findFirst({
    select: {
      id: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const nextRecord = existing
    ? await prisma.brand.update({
        where: {
          id: existing.id,
        },
        data: normalized,
      })
    : await prisma.brand.create({
        data: normalized,
      });

  return normalizeBrandProfile(nextRecord, defaultBrandProfile);
}

export async function resetBrandProfile(): Promise<BrandProfile> {
  return saveBrandProfile(defaultBrandProfile);
}
