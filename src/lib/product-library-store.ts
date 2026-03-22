import type { ProductLibraryItem } from "@/types/studio";

const STORAGE_KEY = "vb-jewelry-ai.product-library";

let currentSnapshot: ProductLibraryItem[] | null = null;
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

  return cleaned;
}

function normalizeProductItem(
  raw: unknown,
  fallback?: ProductLibraryItem,
): ProductLibraryItem | null {
  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const candidate = raw as Partial<ProductLibraryItem>;
  const productName = cleanString(candidate.productName, fallback?.productName ?? "");
  const category = cleanString(candidate.category, fallback?.category ?? "");
  const material = cleanString(candidate.material, fallback?.material ?? "");
  const color = cleanString(candidate.color, fallback?.color ?? "");
  const styleTags = cleanStringList(candidate.styleTags, fallback?.styleTags ?? []);
  const productNotes = cleanString(candidate.productNotes, fallback?.productNotes ?? "");

  if (!productName || !category || !material || !color || styleTags.length === 0 || !productNotes) {
    return fallback ?? null;
  }

  return {
    id: cleanString(candidate.id, fallback?.id ?? `product-${productName.toLowerCase()}`),
    productName,
    category,
    material,
    color,
    styleTags,
    productNotes,
    imageDataUrl:
      typeof candidate.imageDataUrl === "string" ? candidate.imageDataUrl : fallback?.imageDataUrl ?? null,
    imageName: cleanString(candidate.imageName, fallback?.imageName ?? ""),
  };
}

function normalizeProductItems(
  raw: unknown,
  fallback: ProductLibraryItem[],
): ProductLibraryItem[] {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  if (raw.length === 0) {
    return [];
  }

  const normalized = raw
    .map((item, index) => normalizeProductItem(item, fallback[index]))
    .filter((item): item is ProductLibraryItem => item !== null);

  return normalized.length > 0 ? normalized : fallback;
}

export function subscribeToProductLibraryStore(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getProductLibrarySnapshot(fallback: ProductLibraryItem[]) {
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
    currentSnapshot = normalizeProductItems(JSON.parse(storedValue), fallback);
    return currentSnapshot;
  } catch {
    return fallback;
  }
}

export function saveProductLibrarySnapshot(nextItems: ProductLibraryItem[]) {
  currentSnapshot = nextItems
    .map((item) => normalizeProductItem(item))
    .filter((item): item is ProductLibraryItem => item !== null);

  if (canUseStorage()) {
    // Local storage is the temporary mock store until product uploads have a backend.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
  }

  listeners.forEach((listener) => listener());
}

export function resetProductLibrarySnapshot(fallback: ProductLibraryItem[]) {
  currentSnapshot = fallback;

  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  listeners.forEach((listener) => listener());
}
