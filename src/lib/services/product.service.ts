import { productLibraryItems as defaultProducts } from "@/data/mock-studio";
import type { ProductLibraryItem } from "@/types/studio";

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeProduct(raw: unknown, fallback?: ProductLibraryItem): ProductLibraryItem | null {
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
    id: cleanString(candidate.id, fallback?.id ?? ""),
    productName,
    category,
    material,
    color,
    styleTags,
    productNotes,
    imageDataUrl:
      typeof candidate.imageDataUrl === "string"
        ? candidate.imageDataUrl
        : fallback?.imageDataUrl ?? null,
    imageName: cleanString(candidate.imageName, fallback?.imageName ?? ""),
  };
}

function normalizeProducts(raw: unknown, fallback: ProductLibraryItem[]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  if (raw.length === 0) {
    return [];
  }

  const normalized = raw
    .map((item, index) => normalizeProduct(item, fallback[index]))
    .filter((item): item is ProductLibraryItem => item !== null);

  return normalized.length > 0 ? normalized : fallback;
}

function createProductId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `product-${slug}-${Math.random().toString(36).slice(2, 7)}`;
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

export async function listProducts(): Promise<ProductLibraryItem[]> {
  const fromApi = await requestJson<ProductLibraryItem[]>("/api/products");

  if (fromApi) {
    return normalizeProducts(fromApi, defaultProducts);
  }

  return defaultProducts;
}

// Alias to match Phase 2C naming while preserving existing imports.
export const getProducts = listProducts;

export async function createProduct(product: ProductLibraryItem): Promise<ProductLibraryItem[]> {
  const candidate = normalizeProduct(product);

  if (!candidate) {
    return listProducts();
  }

  const fromApi = await requestJson<ProductLibraryItem[]>("/api/products", {
    method: "POST",
    body: JSON.stringify({
      ...candidate,
      id: candidate.id || createProductId(candidate.productName),
    }),
  });

  if (fromApi) {
    return normalizeProducts(fromApi, defaultProducts);
  }

  return listProducts();
}

export async function updateProduct(product: ProductLibraryItem): Promise<ProductLibraryItem[]> {
  const candidate = normalizeProduct(product);

  if (!candidate) {
    return listProducts();
  }

  const fromApi = await requestJson<ProductLibraryItem[]>(`/api/products/${candidate.id}`, {
    method: "PUT",
    body: JSON.stringify(candidate),
  });

  if (fromApi) {
    return normalizeProducts(fromApi, defaultProducts);
  }

  return listProducts();
}

export async function deleteProduct(productId: string): Promise<ProductLibraryItem[]> {
  const fromApi = await requestJson<ProductLibraryItem[]>(`/api/products/${productId}`, {
    method: "DELETE",
  });

  if (fromApi) {
    return normalizeProducts(fromApi, defaultProducts);
  }

  return listProducts();
}

export async function resetProducts(): Promise<ProductLibraryItem[]> {
  const fromApi = await requestJson<ProductLibraryItem[]>("/api/products/reset", {
    method: "POST",
  });

  if (fromApi) {
    return normalizeProducts(fromApi, defaultProducts);
  }

  return defaultProducts;
}
