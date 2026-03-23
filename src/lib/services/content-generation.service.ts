import { logEvent } from "@/lib/logger";
import { generateContentIdeas as generateMockContentIdeas } from "@/lib/services/ai.service";
import type {
  BrandProfile,
  ContentIdeaGeneratorInput,
  ContentIdeaPriority,
  GeneratedContentIdeaCard,
} from "@/types/studio";

interface OpenAiMessage {
  role: "system" | "user";
  content: string;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface StructuredIdeasResponse {
  ideas: Array<{
    title?: unknown;
    hook?: unknown;
    conceptSummary?: unknown;
    visualDirection?: unknown;
    captionAngle?: unknown;
    cta?: unknown;
    priority?: unknown;
  }>;
}

interface PromptSections {
  systemInstructions: string;
  brandContext: string;
  personaContext: string;
  productContext: string;
  campaignRequest: string;
}

interface ValidationInput {
  value: unknown;
  fallback: string;
  minLength: number;
  request: ContentIdeaGeneratorInput;
  patterns: RegExp[];
  requireContextSignal?: boolean;
}

interface ValidationResult {
  value: string;
  replaced: boolean;
}

interface SanitizedIdeaResult {
  idea: GeneratedContentIdeaCard;
  replacedFieldCount: number;
}

export interface ContentGenerationServiceResult {
  ideas: GeneratedContentIdeaCard[];
  source: "openai" | "mock_fallback";
  message: string;
}

interface GenerateStructuredIdeasInput {
  brand: BrandProfile;
  request: ContentIdeaGeneratorInput;
  count: number;
}

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const IDEA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          hook: { type: "string" },
          conceptSummary: { type: "string" },
          visualDirection: { type: "string" },
          captionAngle: { type: "string" },
          cta: { type: "string" },
          priority: {
            type: "string",
            enum: ["High", "Medium", "Low"],
          },
        },
        required: [
          "title",
          "hook",
          "conceptSummary",
          "visualDirection",
          "captionAngle",
          "cta",
          "priority",
        ],
      },
    },
  },
  required: ["ideas"],
} as const;

const FIELD_MIN_LENGTH = {
  title: 20,
  hook: 45,
  conceptSummary: 120,
  visualDirection: 110,
  captionAngle: 90,
  cta: 30,
} as const;

const GENERIC_LANGUAGE_PATTERNS = [
  /\bmust[- ]?have\b/i,
  /\bgame[- ]?changer\b/i,
  /\bviral\b/i,
  /\bperfect for (everyone|anyone|any occasion)\b/i,
  /\bobsessed\b/i,
  /\byou need this\b/i,
  /\btrend alert\b/i,
];

const EXAGGERATED_CLAIM_PATTERNS = [
  /\bguaranteed\b/i,
  /\binstantly transform\b/i,
  /\bbest ever\b/i,
  /\bno one can resist\b/i,
  /\bworks for everyone\b/i,
];

const SPAM_CTA_PATTERNS = [
  /\bbuy now\b/i,
  /\bshop now\b/i,
  /\blink in bio\b/i,
  /\blimited time\b/i,
  /\bdon'?t miss out\b/i,
  /\bhurry\b/i,
  /\bact fast\b/i,
  /\brun don'?t walk\b/i,
];

function normalizeCount(requestedCount: number) {
  if (Number.isNaN(requestedCount)) {
    return 1;
  }

  // We intentionally keep content generation to one idea per request.
  return 1;
}

function normalizePriority(
  value: unknown,
  fallback: ContentIdeaPriority,
): ContentIdeaPriority {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value;
  }

  return fallback;
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return raw;
  }

  return raw.slice(firstBrace, lastBrace + 1);
}

function renderList(items: string[], fallback: string) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : fallback;
}

function pickFromList(items: string[], index: number, fallback: string) {
  if (items.length === 0) {
    return fallback;
  }

  return items[index % items.length];
}

function toSentenceCase(value: string) {
  if (value.length === 0) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1);
}

function includesContextSignal(value: string, request: ContentIdeaGeneratorInput) {
  const normalized = value.toLowerCase();
  const signals = [
    request.product.productName,
    request.product.category,
    request.product.material,
    request.product.color,
    request.persona.name,
    request.persona.label,
    ...request.product.styleTags,
  ]
    .flatMap((item) =>
      item
        .toLowerCase()
        .split(/[\s/&-]+/)
        .filter((token) => token.length >= 4),
    )
    .filter(Boolean);

  if (signals.length === 0) {
    return true;
  }

  return signals.some((signal) => normalized.includes(signal));
}

function containsAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function validateIdeaText({
  value,
  fallback,
  minLength,
  request,
  patterns,
  requireContextSignal = false,
}: ValidationInput): ValidationResult {
  const candidate = cleanText(value, fallback);
  const tooShort = candidate.length < minLength;
  const tooGeneric = containsAnyPattern(candidate, patterns);
  const missingContext = requireContextSignal && !includesContextSignal(candidate, request);

  if (tooShort || tooGeneric || missingContext) {
    return {
      value: fallback,
      replaced: true,
    };
  }

  return {
    value: candidate,
    replaced: false,
  };
}

function buildPremiumFallbackIdea(
  request: ContentIdeaGeneratorInput,
  baseFallback: GeneratedContentIdeaCard,
  index: number,
): GeneratedContentIdeaCard {
  const primaryScene = pickFromList(
    request.persona.recommendedScenes,
    index,
    "a soft studio close-up",
  );
  const secondaryUseCase = pickFromList(
    request.persona.bestUseCases,
    index,
    "everyday polished styling",
  );
  const primaryTag = pickFromList(request.product.styleTags, index, "hand-finished detail");
  const colorDirection = renderList(
    request.persona.preferredColors.slice(0, 2),
    request.product.color,
  );
  const polishedType = toSentenceCase(request.contentType);

  return {
    id: baseFallback.id,
    title: `${request.product.productName} — ${polishedType} ${request.mood} concept for ${request.persona.name}`,
    hook: `A hand-finished ${request.product.category.toLowerCase()} piece styled for ${primaryScene.toLowerCase()} with an elevated, wearable finish.`,
    conceptSummary: `${request.persona.name} presents ${request.product.productName} in a ${request.mood.toLowerCase()} ${request.contentType} Reel concept for ${request.platform}. The scene focuses on ${primaryTag.toLowerCase()} details and the product's ${request.product.material.toLowerCase()} craftsmanship while keeping the tone aligned with ${request.persona.contentTone.toLowerCase()}.`,
    visualDirection: `Film in soft directional light with close macro cuts on clasp, texture, and movement. Use a ${colorDirection.toLowerCase()} palette, keep background props minimal, and frame the jewelry against natural hand motion in ${primaryScene.toLowerCase()} for a premium handmade look.`,
    captionAngle: `Write in a ${request.persona.contentTone.toLowerCase()} voice that connects ${request.product.productName} to ${secondaryUseCase.toLowerCase()}. Mention the ${request.product.material.toLowerCase()} finish and why this piece fits ${request.persona.audienceFit.toLowerCase()} without over-promising.`,
    cta: `Invite viewers to save this concept for their next jewelry styling moment and share it with someone planning a refined ${request.product.category.toLowerCase()} look.`,
    priority: baseFallback.priority,
  };
}

function buildSystemInstructions() {
  return [
    "You are a senior creative strategist for an internal handmade jewelry content studio.",
    "Generate structured Instagram Reel ideas that are premium, visually concrete, and brand-safe.",
    "Do not use generic influencer phrasing, exaggerated product claims, or spammy conversion language.",
    "Avoid phrases such as 'must-have', 'game changer', 'viral', 'shop now', or 'link in bio'.",
    "Keep language polished, specific, and useful for internal production handoff.",
    "Always return valid JSON that exactly matches the provided schema.",
  ].join("\n");
}

function buildBrandContext(brand: BrandProfile) {
  return [
    `Brand name: ${brand.brandName}`,
    `Instagram handle: ${brand.instagramHandle}`,
    `Brand voice: ${brand.brandVoice}`,
    `Target customer: ${brand.targetCustomer}`,
    `Style keywords: ${renderList(brand.styleKeywords, "None provided")}`,
    `Preferred colors: ${renderList(brand.preferredColors, "None provided")}`,
    `Product categories: ${renderList(brand.productCategories, "None provided")}`,
    `Do-not-use list: ${renderList(brand.doNotUseList, "None provided")}`,
  ].join("\n");
}

function buildPersonaContext(request: ContentIdeaGeneratorInput) {
  return [
    `Persona name: ${request.persona.name}`,
    `Persona label: ${request.persona.label}`,
    `Age range: ${request.persona.ageRange}`,
    `Style vibe: ${request.persona.styleVibe}`,
    `Audience fit: ${request.persona.audienceFit}`,
    `Best use cases: ${renderList(request.persona.bestUseCases, "None provided")}`,
    `Content tone: ${request.persona.contentTone}`,
    `Recommended scenes: ${renderList(request.persona.recommendedScenes, "None provided")}`,
    `Jewelry fit: ${request.persona.jewelryFit}`,
    `Avoid list: ${renderList(request.persona.avoidList, "None provided")}`,
  ].join("\n");
}

function buildProductContext(request: ContentIdeaGeneratorInput) {
  return [
    `Product name: ${request.product.productName}`,
    `Category: ${request.product.category}`,
    `Material: ${request.product.material}`,
    `Color: ${request.product.color}`,
    `Style tags: ${renderList(request.product.styleTags, "None provided")}`,
    `Product notes: ${request.product.productNotes}`,
  ].join("\n");
}

function buildCampaignRequest(request: ContentIdeaGeneratorInput, count: number) {
  return [
    `Generate exactly ${count} ideas.`,
    `Platform: ${request.platform}`,
    `Mood: ${request.mood}`,
    `Content type: ${request.contentType}`,
    "Each idea must feel handmade, premium, and visually specific to real shot planning.",
    "Each CTA should feel soft and editorial, never pushy.",
  ].join("\n");
}

function buildPromptSections({
  brand,
  request,
  count,
}: GenerateStructuredIdeasInput): PromptSections {
  return {
    systemInstructions: buildSystemInstructions(),
    brandContext: buildBrandContext(brand),
    personaContext: buildPersonaContext(request),
    productContext: buildProductContext(request),
    campaignRequest: buildCampaignRequest(request, count),
  };
}

function buildUserPrompt(sections: PromptSections) {
  return [
    "BRAND CONTEXT",
    sections.brandContext,
    "",
    "PERSONA CONTEXT",
    sections.personaContext,
    "",
    "PRODUCT CONTEXT",
    sections.productContext,
    "",
    "CAMPAIGN REQUEST",
    sections.campaignRequest,
    "",
    "QUALITY RULES",
    "- Make every idea distinct and production-ready.",
    "- Keep hooks precise and non-generic.",
    "- Keep concept summaries grounded in handcrafted jewelry details.",
    "- Include specific camera, lighting, framing, and styling cues in visual direction.",
    "- Respect both brand and persona avoidance constraints.",
  ].join("\n");
}

function buildMessages(sections: PromptSections): OpenAiMessage[] {
  return [
    {
      role: "system",
      content: sections.systemInstructions,
    },
    {
      role: "user",
      content: buildUserPrompt(sections),
    },
  ];
}

function sanitizeIdeaCandidate(
  candidate: StructuredIdeasResponse["ideas"][number],
  fallback: GeneratedContentIdeaCard,
  request: ContentIdeaGeneratorInput,
): SanitizedIdeaResult {
  // These checks protect brand tone even when model output is partial or too generic.
  const title = validateIdeaText({
    value: candidate.title,
    fallback: fallback.title,
    minLength: FIELD_MIN_LENGTH.title,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS],
  });

  const hook = validateIdeaText({
    value: candidate.hook,
    fallback: fallback.hook,
    minLength: FIELD_MIN_LENGTH.hook,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS],
  });

  const conceptSummary = validateIdeaText({
    value: candidate.conceptSummary,
    fallback: fallback.conceptSummary,
    minLength: FIELD_MIN_LENGTH.conceptSummary,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS],
    requireContextSignal: true,
  });

  const visualDirection = validateIdeaText({
    value: candidate.visualDirection,
    fallback: fallback.visualDirection,
    minLength: FIELD_MIN_LENGTH.visualDirection,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS],
    requireContextSignal: true,
  });

  const captionAngle = validateIdeaText({
    value: candidate.captionAngle,
    fallback: fallback.captionAngle,
    minLength: FIELD_MIN_LENGTH.captionAngle,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS],
    requireContextSignal: true,
  });

  const cta = validateIdeaText({
    value: candidate.cta,
    fallback: fallback.cta,
    minLength: FIELD_MIN_LENGTH.cta,
    request,
    patterns: [...GENERIC_LANGUAGE_PATTERNS, ...EXAGGERATED_CLAIM_PATTERNS, ...SPAM_CTA_PATTERNS],
  });

  const replacedFieldCount = [
    title.replaced,
    hook.replaced,
    conceptSummary.replaced,
    visualDirection.replaced,
    captionAngle.replaced,
    cta.replaced,
  ].filter(Boolean).length;

  return {
    idea: {
      id: fallback.id,
      title: title.value,
      hook: hook.value,
      conceptSummary: conceptSummary.value,
      visualDirection: visualDirection.value,
      captionAngle: captionAngle.value,
      cta: cta.value,
      priority: normalizePriority(candidate.priority, fallback.priority),
    },
    replacedFieldCount,
  };
}

async function requestOpenAiStructuredIdeas(
  messages: OpenAiMessage[],
): Promise<StructuredIdeasResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.8,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "vb_jewelry_content_ideas",
            strict: true,
            schema: IDEA_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI request failed (${response.status}): ${errorBody.slice(0, 500)}`,
      );
    }

    const parsed = (await response.json()) as OpenAiChatCompletionResponse;
    const rawContent = parsed.choices?.[0]?.message?.content;

    if (typeof rawContent !== "string" || rawContent.trim().length === 0) {
      throw new Error("OpenAI returned an empty content payload.");
    }

    const jsonPayload = extractJsonObject(rawContent);
    const structured = JSON.parse(jsonPayload) as StructuredIdeasResponse;

    if (!Array.isArray(structured.ideas) || structured.ideas.length === 0) {
      throw new Error("OpenAI response did not include ideas.");
    }

    return structured;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateStructuredContentIdeas({
  brand,
  request,
  count,
}: GenerateStructuredIdeasInput): Promise<ContentGenerationServiceResult> {
  const finalCount = normalizeCount(count);
  const fallbackIdeas = await generateMockContentIdeas(request, finalCount);
  const promptSections = buildPromptSections({
    brand,
    request,
    count: finalCount,
  });
  const messages = buildMessages(promptSections);

  logEvent({
    type: "job_started",
    domain: "ai",
    action: "content-generation-openai",
    message: "Starting OpenAI content idea generation request.",
    metadata: {
      model: OPENAI_MODEL,
      personaId: request.persona.id,
      productId: request.product.id,
      requestedCount: finalCount,
    },
  });

  try {
    const structured = await requestOpenAiStructuredIdeas(messages);
    let totalReplacedFields = 0;

    const ideas = Array.from({ length: finalCount }, (_, index) => {
      const premiumFallback = buildPremiumFallbackIdea(
        request,
        fallbackIdeas[index % fallbackIdeas.length],
        index,
      );
      const candidate = structured.ideas[index] ?? {};
      const sanitized = sanitizeIdeaCandidate(candidate, premiumFallback, request);
      totalReplacedFields += sanitized.replacedFieldCount;
      return sanitized.idea;
    });

    logEvent({
      type: "content_generated",
      domain: "ai",
      action: "content-generation-openai",
      message: `Generated ${ideas.length} structured ideas from OpenAI.`,
      metadata: {
        model: OPENAI_MODEL,
        personaId: request.persona.id,
        productId: request.product.id,
        replacedFieldCount: totalReplacedFields,
      },
    });

    return {
      ideas,
      source: "openai",
      message: `Generated ${ideas.length} ideas with OpenAI.`,
    };
  } catch (error) {
    logEvent({
      type: "generation_failed",
      domain: "ai",
      action: "content-generation-openai",
      message: "OpenAI content generation failed, using fallback ideas.",
      metadata: {
        model: OPENAI_MODEL,
        personaId: request.persona.id,
        productId: request.product.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      ideas: fallbackIdeas.map((idea, index) =>
        buildPremiumFallbackIdea(request, idea, index),
      ),
      source: "mock_fallback",
      message:
        "OpenAI was unavailable, so mock fallback ideas were generated to keep the workflow moving.",
    };
  }
}
