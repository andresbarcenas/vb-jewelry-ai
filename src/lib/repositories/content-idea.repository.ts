import { contentIdeas as defaultContentIdeas } from "@/data/mock-studio";
import { logEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getBrandProfile } from "@/lib/repositories/brand.repository";
import { getPersonaById } from "@/lib/repositories/persona.repository";
import { getProductById, listProducts as listAllProducts } from "@/lib/repositories/product.repository";
import { generateStructuredContentIdeas } from "@/lib/services/content-generation.service";
import {
  contentMoodOptions,
  contentPlatformOptions,
  contentTypeOptions,
} from "@/lib/services/ai.service";
import type {
  ContentIdea,
  ContentIdeaGenerationResult,
  ContentIdeaGeneratorInput,
  ContentIdeaPriority,
  ContentIdeaStatus,
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
} from "@/types/studio";

function normalizeStatus(value: unknown): ContentIdeaStatus {
  if (
    value === "Generated" ||
    value === "Saved" ||
    value === "Ready for Review" ||
    value === "Archived" ||
    value === "Approved Concept" ||
    value === "Ready for Storyboard" ||
    value === "Awaiting Brand Note"
  ) {
    return value;
  }

  return "Generated";
}

function normalizePriority(value: unknown): ContentIdeaPriority {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value;
  }

  return "Medium";
}

function normalizePlatform(value: unknown): ContentPlatform {
  if (typeof value !== "string") {
    return "Instagram Reels";
  }

  const candidate = contentPlatformOptions.find((option) => option === value);
  return candidate ?? "Instagram Reels";
}

function normalizeMood(value: unknown): ContentMood {
  if (typeof value !== "string") {
    return "Elevated";
  }

  const candidate = contentMoodOptions.find((option) => option === value);
  return candidate ?? "Elevated";
}

function normalizeContentType(value: unknown): ContentIdeaType {
  if (typeof value !== "string") {
    return "lifestyle";
  }

  const candidate = contentTypeOptions.find((option) => option === value);
  return candidate ?? "lifestyle";
}

function buildIdeaId(personaId: string, productId: string, index: number) {
  return `idea-${Date.now()}-${personaId.slice(0, 8)}-${productId.slice(0, 8)}-${index + 1}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildTargetLaunchDate() {
  const nextDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().slice(0, 10);
}

function ensureText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function mapRecordToIdea(record: {
  id: string;
  title: string;
  personaId: string;
  personaName: string;
  productId: string | null;
  productName: string | null;
  platform: string | null;
  mood: string | null;
  contentType: string | null;
  status: string;
  products: string[];
  theme: string;
  concept: string;
  visualDirection: string | null;
  hook: string;
  captionAngle: string;
  cta: string | null;
  priority: string;
  autoSaved: boolean;
  targetLaunch: string;
  createdAt: Date;
  updatedAt: Date;
}): ContentIdea {
  return {
    id: record.id,
    title: record.title,
    personaId: record.personaId,
    personaName: record.personaName,
    productId: record.productId ?? undefined,
    productName: record.productName ?? undefined,
    platform: normalizePlatform(record.platform),
    mood: normalizeMood(record.mood),
    contentType: normalizeContentType(record.contentType),
    status: normalizeStatus(record.status),
    products: record.products,
    theme: record.theme,
    concept: record.concept,
    visualDirection: record.visualDirection ?? undefined,
    hook: record.hook,
    captionAngle: record.captionAngle,
    cta: record.cta ?? undefined,
    priority: normalizePriority(record.priority),
    autoSaved: record.autoSaved,
    targetLaunch: record.targetLaunch,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapDefaultIdeaToCreateInput(
  idea: ContentIdea,
  productIdByName: Map<string, string>,
) {
  const productName = idea.products[0] ?? "";

  return {
    id: idea.id,
    title: idea.title,
    personaId: idea.personaId,
    personaName: idea.personaName,
    productId: productIdByName.get(productName) ?? null,
    productName: productName || null,
    platform: "Instagram Reels",
    mood: null,
    contentType: null,
    status: idea.status,
    products: idea.products,
    theme: idea.theme,
    concept: idea.concept,
    visualDirection: idea.visualDirection ?? null,
    hook: idea.hook,
    captionAngle: idea.captionAngle,
    cta: idea.cta ?? null,
    priority: idea.priority,
    autoSaved: idea.autoSaved ?? true,
    targetLaunch: idea.targetLaunch,
  };
}

async function seedDefaultIdeasIfEmpty() {
  const existingCount = await prisma.contentIdea.count();

  if (existingCount > 0) {
    return;
  }

  const products = await listAllProducts();
  const productIdByName = new Map(products.map((item) => [item.productName, item.id]));

  await prisma.contentIdea.createMany({
    data: defaultContentIdeas.map((idea) => mapDefaultIdeaToCreateInput(idea, productIdByName)),
  });
}

export async function listContentIdeas(): Promise<ContentIdea[]> {
  await seedDefaultIdeasIfEmpty();

  const records = await prisma.contentIdea.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return records.map(mapRecordToIdea);
}

export async function generateAndSaveContentIdeas(
  input: ContentIdeaGeneratorInput,
  count = 5,
): Promise<ContentIdeaGenerationResult> {
  const brand = await getBrandProfile();

  const generation = await generateStructuredContentIdeas({
    brand,
    request: input,
    count,
  });

  const targetLaunch = buildTargetLaunchDate();
  const records = generation.ideas.map((idea, index) => ({
    id: buildIdeaId(input.persona.id, input.product.id, index),
    title: idea.title,
    personaId: input.persona.id,
    personaName: input.persona.name,
    productId: input.product.id,
    productName: input.product.productName,
    platform: input.platform,
    mood: input.mood,
    contentType: input.contentType,
    status: "Generated",
    products: [input.product.productName],
    theme: `${input.contentType} · ${input.mood}`,
    concept: idea.conceptSummary,
    visualDirection: ensureText(
      idea.visualDirection,
      `Use close-up handcrafted detail shots for ${input.product.productName}.`,
    ),
    hook: idea.hook,
    captionAngle: idea.captionAngle,
    cta: ensureText(
      idea.cta,
      "Invite viewers to save this concept for their next jewelry styling post.",
    ),
    priority: idea.priority,
    autoSaved: true,
    targetLaunch,
  }));

  await prisma.contentIdea.createMany({
    data: records,
  });

  const savedIdeas = await prisma.contentIdea.findMany({
    where: {
      id: {
        in: records.map((item) => item.id),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  logEvent({
    type: "content_generated",
    domain: "content",
    action: "save-generated-ideas",
    message: `Saved ${savedIdeas.length} generated ideas to the database.`,
    metadata: {
      personaId: input.persona.id,
      productId: input.product.id,
      source: generation.source,
    },
  });

  return {
    ideas: savedIdeas.map(mapRecordToIdea),
    source: generation.source,
    message: generation.message,
  };
}

export async function updateContentIdeaStatus(
  ideaId: string,
  status: ContentIdeaStatus,
): Promise<ContentIdea | null> {
  const updated = await prisma.contentIdea.updateMany({
    where: {
      id: ideaId,
    },
    data: {
      status,
    },
  });

  if (updated.count === 0) {
    return null;
  }

  const record = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
  });

  if (record && status === "Ready for Review") {
    logEvent({
      type: "approval",
      domain: "review",
      action: "mark-ready-for-review",
      message: "Content idea marked as ready for review.",
      metadata: {
        ideaId: record.id,
        personaId: record.personaId,
        productId: record.productId,
      },
    });
  }

  return record ? mapRecordToIdea(record) : null;
}

export async function regenerateContentIdea(
  ideaId: string,
): Promise<ContentIdeaGenerationResult | null> {
  const existing = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
  });

  if (!existing) {
    return null;
  }

  const [persona, product, brand] = await Promise.all([
    getPersonaById(existing.personaId),
    existing.productId ? getProductById(existing.productId) : Promise.resolve(null),
    getBrandProfile(),
  ]);

  if (!persona || !product) {
    logEvent({
      type: "generation_failed",
      domain: "content",
      action: "regenerate-idea",
      message: "Cannot regenerate idea because persona or product was not found.",
      metadata: {
        ideaId,
        personaId: existing.personaId,
        productId: existing.productId,
      },
    });

    return null;
  }

  const request: ContentIdeaGeneratorInput = {
    persona,
    product,
    platform: normalizePlatform(existing.platform),
    mood: normalizeMood(existing.mood),
    contentType: normalizeContentType(existing.contentType),
  };

  const generation = await generateStructuredContentIdeas({
    brand,
    request,
    count: 3,
  });
  const nextIdea = generation.ideas[0];

  const updated = await prisma.contentIdea.update({
    where: {
      id: ideaId,
    },
    data: {
      title: nextIdea.title,
      hook: nextIdea.hook,
      concept: nextIdea.conceptSummary,
      visualDirection: ensureText(
        nextIdea.visualDirection,
        `Use close-up handcrafted detail shots for ${product.productName}.`,
      ),
      captionAngle: nextIdea.captionAngle,
      cta: ensureText(
        nextIdea.cta,
        "Invite viewers to save this concept for their next jewelry styling post.",
      ),
      priority: nextIdea.priority,
      status: "Generated",
      autoSaved: true,
      theme: `${request.contentType} · ${request.mood}`,
      platform: request.platform,
      mood: request.mood,
      contentType: request.contentType,
      targetLaunch: buildTargetLaunchDate(),
    },
  });

  return {
    ideas: [mapRecordToIdea(updated)],
    source: generation.source,
    message: generation.message,
  };
}
