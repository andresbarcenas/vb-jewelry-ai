import { logEvent } from "@/lib/logger";
import type {
  AiPersonaProfile,
  ContentIdea,
  ProductImageQaResult,
  ProductLibraryItem,
  VisualPlan,
} from "@/types/studio";

interface ProductImageGenerationInput {
  persona: AiPersonaProfile;
  product: ProductLibraryItem;
  contentIdea: ContentIdea;
  visualPlan: VisualPlan;
  count: number;
}

export interface GeneratedProductImageResult {
  imageUrl: string;
  promptUsed: string;
  provider: "openai";
  notes?: string;
  matchScore: number;
  matchStatus: "pass";
  qaNotes: string[];
  attempt: number;
}

interface OpenAiImageResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class ProductImageGenerationError extends Error {
  code:
    | "persona_reference_missing"
    | "product_reference_missing"
    | "product_mismatch_or_low_visibility";

  constructor(
    code:
      | "persona_reference_missing"
      | "product_reference_missing"
      | "product_mismatch_or_low_visibility",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "ProductImageGenerationError";
  }
}

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const OPENAI_QA_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const PRODUCT_MATCH_MIN_SCORE = parseNumberEnv(
  process.env.OPENAI_PRODUCT_IMAGE_MATCH_MIN_SCORE,
  0.86,
);
const PRODUCT_IMAGE_MAX_ATTEMPTS = parseIntegerEnv(
  process.env.OPENAI_PRODUCT_IMAGE_MAX_ATTEMPTS,
  3,
);
const PRODUCT_IMAGE_RETRY_DELAY_MS = parseIntegerEnv(
  process.env.OPENAI_PRODUCT_IMAGE_RETRY_DELAY_MS,
  1200,
);

const QA_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    pass: {
      type: "boolean",
    },
    reasons: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 6,
    },
    productVisible: {
      type: "boolean",
    },
    visibilityReasons: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 6,
    },
  },
  required: ["score", "pass", "reasons", "productVisible", "visibilityReasons"],
} as const;

function parseIntegerEnv(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseNumberEnv(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function clampCount(value: number) {
  return Math.max(1, Math.min(3, Math.round(value)));
}

function waitFor(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return raw;
  }

  return raw.slice(firstBrace, lastBrace + 1);
}

function normalizeQaScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function extensionFromMime(mimeType: string) {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }

  if (normalized.includes("webp")) {
    return "webp";
  }

  if (normalized.includes("gif")) {
    return "gif";
  }

  return "png";
}

function decodeDataUrl(reference: string): { blob: Blob; mimeType: string } | null {
  const match = reference.match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=\r\n]+)$/);

  if (!match) {
    return null;
  }

  const mimeType = match[1] || "image/png";
  const base64 = match[2].replace(/\s+/g, "");
  const bytes = Buffer.from(base64, "base64");

  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
  };
}

async function resolveReferenceImage(
  reference: string,
  fallbackFilePrefix: string,
): Promise<{ blob: Blob; fileName: string }> {
  const fromDataUrl = decodeDataUrl(reference);
  if (fromDataUrl) {
    return {
      blob: fromDataUrl.blob,
      fileName: `${fallbackFilePrefix}.${extensionFromMime(fromDataUrl.mimeType)}`,
    };
  }

  if (!isHttpUrl(reference)) {
    throw new Error(
      `${fallbackFilePrefix} must be an image data URL or absolute image URL.`,
    );
  }

  const response = await fetch(reference, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${fallbackFilePrefix} reference image (${response.status}).`,
    );
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/png";

  return {
    blob,
    fileName: `${fallbackFilePrefix}.${extensionFromMime(mimeType)}`,
  };
}

function buildGenerationReferences(input: ProductImageGenerationInput) {
  const personaReference = input.persona.primaryReferenceImageUrl?.trim() ?? "";
  const productReference = input.product.imageDataUrl?.trim() ?? "";

  if (!personaReference) {
    throw new ProductImageGenerationError(
      "persona_reference_missing",
      "Please set a primary persona reference image first so the model look stays consistent.",
    );
  }

  if (!productReference) {
    throw new ProductImageGenerationError(
      "product_reference_missing",
      "We couldn't find a product reference image. Please upload a clear product photo in Product Library before generating product-on-person images.",
    );
  }

  return {
    personaReference,
    productReference,
  };
}

function buildPrompt(input: ProductImageGenerationInput, variationIndex: number) {
  const visualPlan = input.visualPlan;

  return [
    "Create one premium photorealistic product-on-person image for handmade jewelry marketing.",
    "Hard constraints: the generated jewelry must match the provided product reference image design.",
    "Hard constraints: keep the same model identity as the persona reference image.",
    "Do not use generic influencer language, exaggerated claims, logos, text overlays, or watermarks.",
    "Do not invent a different jewelry shape, pendant, clasp, gemstone, or silhouette.",
    `Persona name: ${input.persona.name}.`,
    `Persona style vibe: ${input.persona.styleVibe}.`,
    `Persona tone: ${input.persona.contentTone}.`,
    `Persona avoid list: ${input.persona.avoidList.join(", ")}.`,
    `Product name: ${input.product.productName}.`,
    `Product category: ${input.product.category}.`,
    `Product material: ${input.product.material}.`,
    `Product color: ${input.product.color}.`,
    `Product style tags: ${input.product.styleTags.join(", ")}.`,
    `Product notes: ${input.product.productNotes}.`,
    `Concept title: ${input.contentIdea.title}.`,
    `Hook: ${input.contentIdea.hook}.`,
    `Concept summary: ${input.contentIdea.concept}.`,
    `Platform: ${input.contentIdea.platform ?? "Instagram Reels"}.`,
    `Mood: ${input.contentIdea.mood ?? "Elevated"}.`,
    `Content type: ${input.contentIdea.contentType ?? "lifestyle"}.`,
    `Scene description: ${visualPlan.sceneDescription}.`,
    `Lighting: ${visualPlan.lighting}.`,
    `Camera angle: ${visualPlan.cameraAngle}.`,
    `Motion cues to imply in still image: ${visualPlan.motion}.`,
    `Styling notes: ${visualPlan.stylingNotes}.`,
    `Product focus: ${visualPlan.productFocus}.`,
    `Scene mood: ${visualPlan.sceneMood}.`,
    `Background: ${visualPlan.background}.`,
    `Avoid: ${visualPlan.avoid}.`,
    `Shot sequence reference: ${visualPlan.shotSequence.join(" | ")}.`,
    "Critical requirements: keep face consistent, keep jewelry clearly visible, and match lighting direction to the visual plan.",
    "Critical requirements: product is the hero and must be fully recognizable as the exact uploaded design.",
    "Output only the image.",
    `Variation index: ${variationIndex + 1}.`,
  ].join(" ");
}

async function requestOpenAiImage(
  prompt: string,
  personaReference: string,
  productReference: string,
) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing, so product image generation cannot run.");
  }

  const [personaImage, productImage] = await Promise.all([
    resolveReferenceImage(personaReference, "persona-reference"),
    resolveReferenceImage(productReference, "product-reference"),
  ]);

  const endpoint = `${OPENAI_BASE_URL.replace(/\/$/, "")}/images/edits`;
  const formData = new FormData();
  formData.set("model", OPENAI_IMAGE_MODEL);
  formData.set("prompt", prompt);
  formData.set("size", "1024x1024");
  formData.append("image[]", personaImage.blob, personaImage.fileName);
  formData.append("image[]", productImage.blob, productImage.fileName);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI product image generation failed with status ${response.status}: ${errorText.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as OpenAiImageResponse;
  const item = payload.data?.[0];

  if (item?.url) {
    return item.url;
  }

  if (item?.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }

  throw new Error("OpenAI product image response did not include image output.");
}

async function evaluateProductMatch(
  input: ProductImageGenerationInput,
  generatedImageUrl: string,
  productReference: string,
): Promise<ProductImageQaResult> {
  if (!OPENAI_API_KEY) {
    return {
      score: 0,
      pass: false,
      reasons: [
        "OPENAI_API_KEY is missing, so strict product match QA could not run.",
      ],
      productVisible: false,
      visibilityReasons: [
        "Product visibility QA could not run because OPENAI_API_KEY is missing.",
      ],
    };
  }

  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_QA_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a strict image QA reviewer for jewelry product identity matching. Score whether generated jewelry matches the reference product exactly enough for brand-safe publishing.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `Product name: ${input.product.productName}`,
                `Material: ${input.product.material}`,
                `Color: ${input.product.color}`,
                `Category: ${input.product.category}`,
                `Style tags: ${input.product.styleTags.join(", ")}`,
                "Task: Compare the product reference image with the generated product-on-person image.",
                "Return score 0 to 1. Use strict criteria for silhouette, pendant/shape details, chain pattern, and defining features.",
                "Also verify product visibility. The jewelry must be clearly visible and readable in the generated image.",
                `Mark pass=true only when score >= ${PRODUCT_MATCH_MIN_SCORE} and product identity clearly matches.`,
              ].join("\n"),
            },
            {
              type: "image_url",
              image_url: {
                url: productReference,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: generatedImageUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vb_jewelry_product_match_qa",
          strict: true,
          schema: QA_RESPONSE_SCHEMA,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI product QA failed (${response.status}): ${errorText.slice(0, 400)}`,
    );
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const raw = payload.choices?.[0]?.message?.content;

  if (!raw || raw.trim().length === 0) {
    throw new Error("OpenAI product QA returned empty content.");
  }

  const parsed = JSON.parse(extractJsonObject(raw)) as ProductImageQaResult;
  const score = normalizeQaScore(parsed.score);
  const reasons = Array.isArray(parsed.reasons)
    ? parsed.reasons.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const visibilityReasons = Array.isArray(parsed.visibilityReasons)
    ? parsed.visibilityReasons.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const productVisible = parsed.productVisible === true;
  const pass = Boolean(parsed.pass) && score >= PRODUCT_MATCH_MIN_SCORE && productVisible;

  return {
    score,
    pass,
    reasons:
      reasons.length > 0
        ? reasons
        : ["The generated jewelry did not clearly match the reference product."],
    productVisible,
    visibilityReasons:
      visibilityReasons.length > 0
        ? visibilityReasons
        : ["Product visibility was not clearly confirmed."],
  };
}

export async function generateProductImage(
  input: ProductImageGenerationInput,
): Promise<GeneratedProductImageResult[]> {
  const requestedCount = clampCount(input.count);
  const { personaReference, productReference } = buildGenerationReferences(input);

  logEvent({
    type: "job_started",
    domain: "ai",
    action: "generate-product-image",
    message: "Starting product-on-person image generation.",
    metadata: {
      contentIdeaId: input.contentIdea.id,
      personaId: input.persona.id,
      productId: input.product.id,
      requestedCount,
      model: OPENAI_IMAGE_MODEL,
      matchMinScore: PRODUCT_MATCH_MIN_SCORE,
      maxAttempts: PRODUCT_IMAGE_MAX_ATTEMPTS,
    },
  });

  const results: GeneratedProductImageResult[] = [];

  for (let index = 0; index < requestedCount; index += 1) {
    const promptUsed = buildPrompt(input, index);
    let lastFailureReason = "Unknown strict-match failure.";

    for (let attempt = 1; attempt <= PRODUCT_IMAGE_MAX_ATTEMPTS; attempt += 1) {
      try {
        const imageUrl = await requestOpenAiImage(promptUsed, personaReference, productReference);

        if (!imageUrl) {
          lastFailureReason = "OpenAI did not return an image.";
          continue;
        }

        const qa = await evaluateProductMatch(input, imageUrl, productReference);

        logEvent({
          type: qa.pass ? "content_generated" : "generation_failed",
          domain: "ai",
          action: "qa-product-image-variant",
          message: qa.pass
            ? "Generated variant passed strict product match QA."
            : "Generated variant failed strict product match QA.",
          metadata: {
            contentIdeaId: input.contentIdea.id,
            personaId: input.persona.id,
            productId: input.product.id,
            variant: index + 1,
            attempt,
            matchScore: qa.score,
            matchMinScore: PRODUCT_MATCH_MIN_SCORE,
            productVisible: qa.productVisible,
            visibilityReasons: qa.visibilityReasons,
            reasons: qa.reasons,
          },
        });

        if (qa.pass) {
          const qaNotes = Array.from(
            new Set([...qa.reasons, ...qa.visibilityReasons]),
          );

          results.push({
            imageUrl,
            promptUsed,
            provider: "openai",
            notes: "Passed strict product match QA.",
            matchScore: qa.score,
            matchStatus: "pass",
            qaNotes,
            attempt,
          });
          break;
        }

        lastFailureReason = [...qa.reasons, ...qa.visibilityReasons].join("; ");

        if (attempt < PRODUCT_IMAGE_MAX_ATTEMPTS) {
          await waitFor(PRODUCT_IMAGE_RETRY_DELAY_MS);
        }
      } catch (error) {
        lastFailureReason = error instanceof Error ? error.message : "Unknown OpenAI error";

        logEvent({
          type: "generation_failed",
          domain: "ai",
          action: "generate-product-image-variant",
          message: "OpenAI product image variant attempt failed.",
          metadata: {
            contentIdeaId: input.contentIdea.id,
            personaId: input.persona.id,
            productId: input.product.id,
            variant: index + 1,
            attempt,
            error: lastFailureReason,
          },
        });

        if (attempt < PRODUCT_IMAGE_MAX_ATTEMPTS) {
          await waitFor(PRODUCT_IMAGE_RETRY_DELAY_MS);
        }
      }
    }

    if (results.length < index + 1) {
      logEvent({
        type: "generation_failed",
        domain: "ai",
        action: "generate-product-image",
        message: "Strict product accuracy mode blocked saving this generated image.",
        metadata: {
          reasonCode: "product_mismatch_or_low_visibility",
          contentIdeaId: input.contentIdea.id,
          personaId: input.persona.id,
          productId: input.product.id,
          variant: index + 1,
          reason: lastFailureReason,
        },
      });

      throw new ProductImageGenerationError(
        "product_mismatch_or_low_visibility",
        `We couldn't confirm this image matches the selected product yet. Please retry or update the product reference image. Details: ${lastFailureReason}`,
      );
    }
  }

  logEvent({
    type: "content_generated",
    domain: "ai",
    action: "generate-product-image",
    message: "Product-on-person image generation completed.",
    metadata: {
      contentIdeaId: input.contentIdea.id,
      personaId: input.persona.id,
      productId: input.product.id,
      total: results.length,
      openAiCount: results.length,
      fallbackCount: 0,
      model: OPENAI_IMAGE_MODEL,
      matchMinScore: PRODUCT_MATCH_MIN_SCORE,
    },
  });

  return results;
}
