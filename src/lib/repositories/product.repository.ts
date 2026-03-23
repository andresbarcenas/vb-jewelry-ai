import { prisma } from "@/lib/prisma";
import type { ProductLibraryItem } from "@/types/studio";

const seedProducts: ProductLibraryItem[] = [
  {
    id: "product-vb-test-studio",
    productName: "VB Test Studio Necklace",
    category: "Necklaces",
    material: "14k gold vermeil with freshwater pearl accent",
    color: "Soft gold",
    styleTags: ["test product", "studio", "minimal"],
    productNotes:
      "Single development product used as a stable test item while we transition away from mock product data.",
    imageDataUrl: null,
    imageName: "vb-test-studio-necklace.png",
  },
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

function toDatabaseInput(product: ProductLibraryItem) {
  return {
    id: product.id,
    productName: product.productName,
    category: product.category,
    material: product.material,
    color: product.color,
    styleTags: product.styleTags,
    productNotes: product.productNotes,
    imageDataUrl: product.imageDataUrl,
    imageName: product.imageName,
  };
}

function fromDatabaseOutput(raw: {
  id: string;
  productName: string;
  category: string;
  material: string;
  color: string;
  styleTags: string[];
  productNotes: string;
  imageDataUrl: string | null;
  imageName: string;
}): ProductLibraryItem | null {
  return normalizeProduct(raw, seedProducts.find((item) => item.id === raw.id));
}

export async function getProducts(): Promise<ProductLibraryItem[]> {
  const records = await prisma.product.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (records.length === 0) {
    await prisma.product.createMany({
      data: seedProducts.map(toDatabaseInput),
    });
    return seedProducts;
  }

  const normalized = records
    .map(fromDatabaseOutput)
    .filter((item): item is ProductLibraryItem => item !== null);

  return normalizeProducts(normalized, seedProducts);
}

export async function listProducts(): Promise<ProductLibraryItem[]> {
  return getProducts();
}

export async function getProductById(productId: string): Promise<ProductLibraryItem | null> {
  const products = await getProducts();
  return products.find((item) => item.id === productId) ?? null;
}

export async function createProduct(product: ProductLibraryItem): Promise<ProductLibraryItem[]> {
  const current = await getProducts();
  const candidate = normalizeProduct(product);

  if (!candidate) {
    return current;
  }

  const id = candidate.id || createProductId(candidate.productName);
  await prisma.product.upsert({
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

  return getProducts();
}

export async function updateProduct(product: ProductLibraryItem): Promise<ProductLibraryItem[]> {
  const current = await getProducts();
  const candidate = normalizeProduct(product);

  if (!candidate) {
    return current;
  }

  await prisma.product.update({
    where: {
      id: candidate.id,
    },
    data: toDatabaseInput(candidate),
  });

  return getProducts();
}

export async function deleteProduct(productId: string): Promise<ProductLibraryItem[]> {
  await prisma.product.deleteMany({
    where: {
      id: productId,
    },
  });

  return getProducts();
}

export async function resetProducts(): Promise<ProductLibraryItem[]> {
  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: seedProducts.map(toDatabaseInput),
  });
  return getProducts();
}
