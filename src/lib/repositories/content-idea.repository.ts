import { contentIdeas as defaultContentIdeas } from "@/data/mock-studio";
import { runGenerateVisualPlanJob } from "@/lib/jobs/generateVisualPlan.job";
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
  VideoAsset,
  VideoAssetStatus,
  VisualPlan,
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

function normalizeVideoAssetStatus(value: unknown): VideoAssetStatus {
  if (value === "draft" || value === "generating" || value === "ready" || value === "approved") {
    return value;
  }

  return "draft";
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

function buildVideoAssetId(contentIdeaId: string) {
  return `video-asset-${contentIdeaId}`;
}

function serializeVisualPlan(plan: VisualPlan) {
  return JSON.stringify({
    sceneDescription: plan.sceneDescription.trim(),
    lighting: plan.lighting.trim(),
    cameraAngle: plan.cameraAngle.trim(),
    motion: plan.motion.trim(),
    stylingNotes: plan.stylingNotes.trim(),
  });
}

function parseVisualPlan(raw: string | null): VisualPlan | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VisualPlan>;

    if (
      typeof parsed.sceneDescription === "string" &&
      typeof parsed.lighting === "string" &&
      typeof parsed.cameraAngle === "string" &&
      typeof parsed.motion === "string" &&
      typeof parsed.stylingNotes === "string"
    ) {
      return {
        sceneDescription: parsed.sceneDescription.trim(),
        lighting: parsed.lighting.trim(),
        cameraAngle: parsed.cameraAngle.trim(),
        motion: parsed.motion.trim(),
        stylingNotes: parsed.stylingNotes.trim(),
      };
    }
  } catch {
    // Fall back below if older data used plain text instead of JSON.
  }

  const normalized = raw.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  return {
    sceneDescription: normalized,
    lighting: "Soft, polished lighting that keeps product details visible.",
    cameraAngle: "Use a blend of close-up details and waist-up framing.",
    motion: "Keep motion steady with gentle transitions.",
    stylingNotes: "Keep styling minimal so the jewelry remains the hero.",
  };
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
  visualPlan: string | null;
  hook: string;
  captionAngle: string;
  cta: string | null;
  priority: string;
  autoSaved: boolean;
  targetLaunch: string;
  videoAssets: Array<{
    id: string;
    contentIdeaId: string;
    status: string;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    generationNotes: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): ContentIdea {
  const videoAssets: VideoAsset[] = record.videoAssets.map((asset) => ({
    id: asset.id,
    contentIdeaId: asset.contentIdeaId,
    status: normalizeVideoAssetStatus(asset.status),
    videoUrl: asset.videoUrl ?? undefined,
    thumbnailUrl: asset.thumbnailUrl ?? undefined,
    generationNotes: asset.generationNotes,
    provider: asset.provider,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }));

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
    visualPlan: parseVisualPlan(record.visualPlan),
    hook: record.hook,
    captionAngle: record.captionAngle,
    cta: record.cta ?? undefined,
    priority: normalizePriority(record.priority),
    autoSaved: record.autoSaved,
    videoAssets,
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
    visualPlan: idea.visualPlan ? serializeVisualPlan(idea.visualPlan) : null,
    hook: idea.hook,
    captionAngle: idea.captionAngle,
    cta: idea.cta ?? null,
    priority: idea.priority,
    autoSaved: idea.autoSaved ?? true,
    targetLaunch: idea.targetLaunch,
  };
}

function buildDraftVideoAsset(
  contentIdeaId: string,
  generationNotes = "Video not generated yet. Create a visual plan first.",
) {
  return {
    id: buildVideoAssetId(contentIdeaId),
    contentIdeaId,
    status: "draft",
    videoUrl: null,
    thumbnailUrl: null,
    generationNotes,
    provider: "mock-video-pipeline",
  };
}

async function ensureVideoAssetsForIdeas(contentIdeaIds: string[]) {
  if (contentIdeaIds.length === 0) {
    return;
  }

  const existingAssets = await prisma.videoAsset.findMany({
    where: {
      contentIdeaId: {
        in: contentIdeaIds,
      },
    },
    select: {
      contentIdeaId: true,
    },
    distinct: ["contentIdeaId"],
  });

  const existingIds = new Set(existingAssets.map((asset) => asset.contentIdeaId));
  const missingIds = contentIdeaIds.filter((ideaId) => !existingIds.has(ideaId));

  if (missingIds.length === 0) {
    return;
  }

  await prisma.videoAsset.createMany({
    data: missingIds.map((ideaId) => buildDraftVideoAsset(ideaId)),
    skipDuplicates: true,
  });
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

  await prisma.videoAsset.createMany({
    data: defaultContentIdeas.map((idea) =>
      buildDraftVideoAsset(
        idea.id,
        "Video not generated yet. Create a visual plan when this idea is ready for pre-production.",
      ),
    ),
    skipDuplicates: true,
  });
}

export async function listContentIdeas(): Promise<ContentIdea[]> {
  await seedDefaultIdeasIfEmpty();
  const ideaIds = (await prisma.contentIdea.findMany({
    select: {
      id: true,
    },
  })).map((item) => item.id);

  await ensureVideoAssetsForIdeas(ideaIds);

  const records = await prisma.contentIdea.findMany({
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
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
    visualPlan: null,
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

  await prisma.videoAsset.createMany({
    data: records.map((record) =>
      buildDraftVideoAsset(
        record.id,
        "Video not generated yet. Generate a visual plan before requesting video output.",
      ),
    ),
    skipDuplicates: true,
  });

  const savedIdeas = await prisma.contentIdea.findMany({
    where: {
      id: {
        in: records.map((item) => item.id),
      },
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
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
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
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

export async function generateVisualPlanForIdea(
  ideaId: string,
): Promise<ContentIdea | null> {
  const existing = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!existing) {
    return null;
  }

  await prisma.videoAsset.upsert({
    where: {
      id: buildVideoAssetId(ideaId),
    },
    create: {
      ...buildDraftVideoAsset(
        ideaId,
        "Generating visual plan. Video output will remain in draft until a provider is connected.",
      ),
      status: "generating",
    },
    update: {
      status: "generating",
      generationNotes:
        "Generating visual plan. Video output will remain in draft until a provider is connected.",
      provider: "mock-video-pipeline",
    },
  });

  const jobResult = await runGenerateVisualPlanJob({
    contentIdea: mapRecordToIdea(existing),
  });

  await prisma.contentIdea.update({
    where: {
      id: ideaId,
    },
    data: {
      visualPlan: serializeVisualPlan(jobResult.data.visualPlan),
      visualDirection: ensureText(
        existing.visualDirection ?? undefined,
        jobResult.data.visualPlan.sceneDescription,
      ),
    },
  });

  await prisma.videoAsset.upsert({
    where: {
      id: buildVideoAssetId(ideaId),
    },
    create: buildDraftVideoAsset(
      ideaId,
      "Visual plan is ready. Video not generated yet.",
    ),
    update: {
      status: "draft",
      generationNotes: "Visual plan is ready. Video not generated yet.",
      provider: "mock-video-pipeline",
    },
  });

  const refreshed = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!refreshed) {
    return null;
  }

  logEvent({
    type: "job_completed",
    domain: "content",
    action: "visual-plan-ready",
    message: "Visual plan generated and saved for content idea.",
    metadata: {
      ideaId,
      videoAssetId: buildVideoAssetId(ideaId),
    },
  });

  return mapRecordToIdea(refreshed);
}

export async function regenerateContentIdea(
  ideaId: string,
): Promise<ContentIdeaGenerationResult | null> {
  const existing = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
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

  await prisma.contentIdea.update({
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
      visualPlan: null,
      targetLaunch: buildTargetLaunchDate(),
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  await prisma.videoAsset.upsert({
    where: {
      id: buildVideoAssetId(ideaId),
    },
    create: buildDraftVideoAsset(
      ideaId,
      "Idea was regenerated. Create a fresh visual plan before video generation.",
    ),
    update: {
      status: "draft",
      videoUrl: null,
      thumbnailUrl: null,
      generationNotes:
        "Idea was regenerated. Create a fresh visual plan before video generation.",
      provider: "mock-video-pipeline",
    },
  });

  const refreshed = await prisma.contentIdea.findUnique({
    where: {
      id: ideaId,
    },
    include: {
      videoAssets: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!refreshed) {
    return null;
  }

  return {
    ideas: [mapRecordToIdea(refreshed)],
    source: generation.source,
    message: generation.message,
  };
}
