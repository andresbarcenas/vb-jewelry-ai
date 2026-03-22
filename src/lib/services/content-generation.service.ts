import "server-only";

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

function normalizeCount(requestedCount: number) {
  if (Number.isNaN(requestedCount)) {
    return 5;
  }

  return Math.min(5, Math.max(3, Math.round(requestedCount)));
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

  const normalized = value.trim();
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

function buildSystemPrompt(brand: BrandProfile) {
  const guardrailTerms = brand.doNotUseList.join(", ");
  const styleKeywords = brand.styleKeywords.join(", ");
  const colors = brand.preferredColors.join(", ");
  const categories = brand.productCategories.join(", ");

  return [
    "You are a senior social strategist for a premium handmade jewelry studio.",
    "Generate concise, production-ready Instagram Reel content ideas for internal team use.",
    "Keep language polished, specific, and visual. Avoid generic marketing filler.",
    `Brand voice: ${brand.brandVoice}`,
    `Style keywords: ${styleKeywords}`,
    `Preferred color direction: ${colors}`,
    `Product categories: ${categories}`,
    `Never use these terms or tones: ${guardrailTerms}`,
    "Output MUST be valid JSON matching the provided schema.",
  ].join("\n");
}

function buildUserPrompt({ brand, request, count }: GenerateStructuredIdeasInput) {
  const personaAvoid = request.persona.avoidList.join(", ");
  const personaUseCases = request.persona.bestUseCases.join(", ");
  const productTags = request.product.styleTags.join(", ");

  return [
    `Generate ${count} distinct content ideas.`,
    "Context:",
    `- Brand: ${brand.brandName} (${brand.instagramHandle})`,
    `- Persona: ${request.persona.name} (${request.persona.label})`,
    `- Persona vibe: ${request.persona.styleVibe}`,
    `- Persona audience fit: ${request.persona.audienceFit}`,
    `- Persona use cases: ${personaUseCases}`,
    `- Persona avoid list: ${personaAvoid}`,
    `- Product: ${request.product.productName}`,
    `- Product category: ${request.product.category}`,
    `- Product material: ${request.product.material}`,
    `- Product color: ${request.product.color}`,
    `- Product style tags: ${productTags}`,
    `- Product notes: ${request.product.productNotes}`,
    `- Platform: ${request.platform}`,
    `- Mood: ${request.mood}`,
    `- Content type: ${request.contentType}`,
    "",
    "Instructions:",
    "- Make ideas feel premium and visually specific.",
    "- Ensure each hook feels distinct.",
    "- Keep each concept appropriate for a handmade jewelry brand.",
    "- Respect both brand do-not-use and persona avoid constraints.",
    "- Use practical CTA language for internal content planning.",
  ].join("\n");
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

  const messages: OpenAiMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(brand),
    },
    {
      role: "user",
      content: buildUserPrompt({
        brand,
        request,
        count: finalCount,
      }),
    },
  ];

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

    const ideas = Array.from({ length: finalCount }, (_, index) => {
      const fallback = fallbackIdeas[index % fallbackIdeas.length];
      const candidate = structured.ideas[index] ?? {};

      return {
        id: fallback.id,
        title: cleanText(candidate.title, fallback.title),
        hook: cleanText(candidate.hook, fallback.hook),
        conceptSummary: cleanText(candidate.conceptSummary, fallback.conceptSummary),
        visualDirection: cleanText(candidate.visualDirection, fallback.visualDirection),
        captionAngle: cleanText(candidate.captionAngle, fallback.captionAngle),
        cta: cleanText(candidate.cta, fallback.cta),
        priority: normalizePriority(candidate.priority, fallback.priority),
      };
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
      ideas: fallbackIdeas,
      source: "mock_fallback",
      message:
        "OpenAI was unavailable, so mock fallback ideas were generated to keep the workflow moving.",
    };
  }
}
