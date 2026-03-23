import {
  generateAndSaveContentIdeas,
  generateProductImagesForIdea,
  regenerateContentIdea,
} from "@/lib/repositories/content-idea.repository";
import { ProductImageGenerationError } from "@/lib/services/product-image-generation.service";
import {
  generatePersonaReferencePackForPersona,
  getPersonaById,
} from "@/lib/repositories/persona.repository";
import { getProductById } from "@/lib/repositories/product.repository";
import {
  getAiQueueConfig,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobStarted,
  moveDueAiJobsToQueue,
  popNextQueuedAiJob,
} from "@/lib/jobs/ai-job-queue";
import { logEvent } from "@/lib/logger";
import type {
  AiJobRecord,
  ContentIdeaGeneratorInput,
  ContentGenerationJobPayload,
  ProductImageGenerationJobPayload,
  ContentRegenerationJobPayload,
  PersonaReferencePackJobPayload,
} from "@/types/studio";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function asContentPayload(payload: unknown): ContentGenerationJobPayload {
  return payload as ContentGenerationJobPayload;
}

function asPersonaPayload(payload: unknown): PersonaReferencePackJobPayload {
  return payload as PersonaReferencePackJobPayload;
}

function asRegenerationPayload(payload: unknown): ContentRegenerationJobPayload {
  return payload as ContentRegenerationJobPayload;
}

function asProductImagePayload(payload: unknown): ProductImageGenerationJobPayload {
  return payload as ProductImageGenerationJobPayload;
}

async function processContentGenerationJob(job: AiJobRecord) {
  const payload = asContentPayload(job.payload);

  const [persona, product] = await Promise.all([
    getPersonaById(payload.personaId),
    getProductById(payload.productId),
  ]);

  if (!persona || !product) {
    throw new Error("Selected persona or product no longer exists.");
  }

  const input: ContentIdeaGeneratorInput = {
    persona,
    product,
    platform: payload.platform,
    mood: payload.mood,
    contentType: payload.contentType,
  };

  const result = await generateAndSaveContentIdeas(input, payload.count);

  return {
    message: `${result.ideas.length} ideas generated and saved.`,
    metadata: {
      ideaCount: result.ideas.length,
      ideaIds: result.ideas.map((idea) => idea.id),
      source: result.source,
      personaId: payload.personaId,
      productId: payload.productId,
    },
  };
}

async function processPersonaReferencePackJob(job: AiJobRecord) {
  const payload = asPersonaPayload(job.payload);
  const persona = await generatePersonaReferencePackForPersona(payload.personaId);

  if (!persona) {
    throw new Error("Persona no longer exists.");
  }

  const assets = persona.referenceAssets ?? [];
  const fallbackCount = assets.filter((item) => item.provider === "mock_fallback").length;
  const openAiCount = assets.length - fallbackCount;

  return {
    message:
      openAiCount > 0
        ? "Reference pack generated and saved."
        : "Reference pack saved with fallback previews for this run.",
    metadata: {
      personaId: payload.personaId,
      totalAssets: assets.length,
      openAiCount,
      fallbackCount,
    },
  };
}

async function processContentRegenerationJob(job: AiJobRecord) {
  const payload = asRegenerationPayload(job.payload);
  const regenerated = await regenerateContentIdea(payload.ideaId);

  if (!regenerated || regenerated.ideas.length === 0) {
    throw new Error("Could not regenerate this idea.");
  }

  const idea = regenerated.ideas[0];

  return {
    message:
      regenerated.source === "openai"
        ? "Idea regenerated and saved."
        : "Idea regenerated with fallback content and saved.",
    metadata: {
      ideaCount: 1,
      ideaIds: [idea.id],
      source: regenerated.source,
      ideaId: payload.ideaId,
    },
  };
}

async function processProductImageGenerationJob(job: AiJobRecord) {
  const payload = asProductImagePayload(job.payload);
  const result = await generateProductImagesForIdea(
    payload.contentIdeaId,
    payload.count,
    payload.replaceAssetId,
  );

  return {
    message: `${result.generatedCount} product image(s) generated and saved.`,
    metadata: {
      ideaCount: 1,
      ideaIds: [result.idea.id],
      ideaId: result.idea.id,
      generatedCount: result.generatedCount,
      openAiCount: result.openAiCount,
      fallbackCount: result.fallbackCount,
      replaceAssetId: payload.replaceAssetId ?? null,
    },
  };
}

async function processJob(job: AiJobRecord) {
  if (job.type === "content_generation") {
    return processContentGenerationJob(job);
  }

  if (job.type === "persona_reference_pack") {
    return processPersonaReferencePackJob(job);
  }

  if (job.type === "content_regeneration") {
    return processContentRegenerationJob(job);
  }

  if (job.type === "product_image_generation") {
    return processProductImageGenerationJob(job);
  }

  throw new Error(`Unsupported job type: ${job.type}`);
}

export async function runAiWorkerLoop() {
  const config = getAiQueueConfig();

  logEvent({
    type: "job_started",
    domain: "system",
    action: "ai-worker-loop",
    message: "AI worker started.",
    metadata: {
      pollIntervalMs: config.pollIntervalMs,
      maxAttempts: config.maxAttempts,
      backoffMs: config.backoffMs,
    },
  });

  while (true) {
    try {
      await moveDueAiJobsToQueue();
      const nextJob = await popNextQueuedAiJob();

      if (!nextJob) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      const startedJob = await markAiJobStarted(nextJob);

      try {
        const result = await processJob(startedJob);
        await markAiJobCompleted(startedJob, result.message, result.metadata);
      } catch (error) {
        const reasonCode =
          error instanceof ProductImageGenerationError ? error.code : undefined;

        await markAiJobFailed(
          startedJob,
          error instanceof Error ? error.message : "Unknown worker failure",
          reasonCode
            ? {
                reasonCode,
              }
            : undefined,
          reasonCode
            ? {
                // Product-image strict mode already retries inside generation service.
                // Avoid queue-level retries for known hard-block reason codes.
                disableRetry: true,
              }
            : undefined,
        );
      }
    } catch (error) {
      logEvent({
        type: "job_failed",
        domain: "system",
        action: "ai-worker-loop",
        message: "AI worker loop hit an unexpected error and will retry.",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown worker loop error",
        },
      });

      await sleep(config.pollIntervalMs);
    }
  }
}
