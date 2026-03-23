import { logEvent } from "@/lib/logger";
import type { AiPersonaProfile, PersonaReferenceShotType } from "@/types/studio";

interface PersonaImageGenerationInput {
  persona: AiPersonaProfile;
}

interface PersonaImageProviderResult {
  shotType: PersonaReferenceShotType;
  imageUrl: string;
  promptUsed: string;
  provider: string;
}

interface PersonaImageProvider {
  createReferencePack: (
    input: PersonaImageGenerationInput,
  ) => Promise<PersonaImageProviderResult[]>;
}

interface OpenAiImageResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

type OpenAiShotOutcome =
  | "success"
  | "timeout"
  | "http_failure"
  | "parse_failure"
  | "network_failure"
  | "missing_api_key";

interface OpenAiShotRequestResult {
  imageUrl: string | null;
  outcome: OpenAiShotOutcome;
  attemptsUsed: number;
  statusCode?: number;
  errorMessage?: string;
  durationMs: number;
}

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

const OPENAI_IMAGE_TIMEOUT_MS = parsePositiveInteger(
  process.env.OPENAI_IMAGE_TIMEOUT_MS,
  60000,
);
const OPENAI_IMAGE_RETRY_COUNT = parseNonNegativeInteger(
  process.env.OPENAI_IMAGE_RETRY_COUNT,
  1,
);
const OPENAI_IMAGE_RETRY_DELAY_MS = parsePositiveInteger(
  process.env.OPENAI_IMAGE_RETRY_DELAY_MS,
  1200,
);

const SHOT_SPECS: Array<{
  shotType: PersonaReferenceShotType;
  label: string;
  framing: string;
}> = [
  {
    shotType: "hero_portrait",
    label: "Hero portrait",
    framing:
      "head-and-shoulders portrait, direct eye-line, polished expression, clean composition",
  },
  {
    shotType: "three_quarter_body",
    label: "3/4 body shot",
    framing:
      "three-quarter body crop, natural pose, visible upper outfit styling, refined posture",
  },
  {
    shotType: "side_profile",
    label: "Side profile",
    framing:
      "true side profile angle, soft jawline highlight, hair and ear area visible for jewelry readability",
  },
  {
    shotType: "close_up_jewelry",
    label: "Close-up jewelry-friendly shot",
    framing:
      "tight beauty crop focused on ear/neck/hand jewelry zones, crisp detail, texture visibility",
  },
];

function createFallbackImageDataUrl(persona: AiPersonaProfile, shotLabel: string): string {
  const escapedName = persona.name.replace(/[<>&"]/g, "");
  const escapedLabel = shotLabel.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2e7d8" />
      <stop offset="52%" stop-color="#f9f3ea" />
      <stop offset="100%" stop-color="#d8c3a9" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)" />
  <circle cx="512" cy="410" r="138" fill="#ffffff" fill-opacity="0.72" />
  <rect x="330" y="564" width="364" height="228" rx="170" fill="#ffffff" fill-opacity="0.56" />
  <text x="512" y="860" text-anchor="middle" font-size="36" font-family="Arial, sans-serif" fill="#5d4a36">${escapedName}</text>
  <text x="512" y="904" text-anchor="middle" font-size="26" font-family="Arial, sans-serif" fill="#6f5f4d">${escapedLabel}</text>
  <text x="512" y="952" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#7f6f5c">Reference preview (fallback mode)</text>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildBasePrompt(persona: AiPersonaProfile) {
  return [
    "Create a premium, photorealistic studio reference image for a jewelry brand persona.",
    "The same fictional person must remain visually consistent across all shots in this request set.",
    `Persona name: ${persona.name}.`,
    `Persona label: ${persona.label}.`,
    `Age range guidance: ${persona.ageRange}.`,
    `Style vibe: ${persona.styleVibe}.`,
    `Audience fit context: ${persona.audienceFit}.`,
    `Content tone: ${persona.contentTone}.`,
    `Preferred color direction: ${persona.preferredColors.join(", ")}.`,
    `Jewelry fit: ${persona.jewelryFit}.`,
    `Avoid list: ${persona.avoidList.join(", ")}.`,
    "Wardrobe should stay neutral and polished so jewelry remains the hero.",
    "Use realistic skin texture and natural proportions.",
    "Keep lighting soft, refined, and product-friendly for metal and gemstone visibility.",
    "No text, no logos, no watermarks, no collage layout.",
  ].join(" ");
}

function buildShotPrompt(persona: AiPersonaProfile, shot: (typeof SHOT_SPECS)[number]) {
  return `${buildBasePrompt(persona)} Shot type: ${shot.label}. Composition guidance: ${shot.framing}.`;
}

async function requestOpenAiImageAttempt(prompt: string): Promise<{
  imageUrl: string | null;
  outcome: OpenAiShotOutcome;
  statusCode?: number;
  errorMessage?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, OPENAI_IMAGE_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: "1024x1024",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        imageUrl: null,
        outcome: "http_failure",
        statusCode: response.status,
      };
    }

    const payload = (await response.json()) as OpenAiImageResponse;
    const item = payload.data?.[0];

    if (item?.url) {
      return {
        imageUrl: item.url,
        outcome: "success",
      };
    }

    if (item?.b64_json) {
      return {
        imageUrl: `data:image/png;base64,${item.b64_json}`,
        outcome: "success",
      };
    }

    return {
      imageUrl: null,
      outcome: "parse_failure",
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        imageUrl: null,
        outcome: "timeout",
      };
    }

    return {
      imageUrl: null,
      outcome: "network_failure",
      errorMessage: error instanceof Error ? error.message : "Unknown network error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function requestOpenAiImageWithRetry(prompt: string): Promise<OpenAiShotRequestResult> {
  const startedAt = Date.now();

  if (!OPENAI_API_KEY) {
    return {
      imageUrl: null,
      outcome: "missing_api_key",
      attemptsUsed: 0,
      durationMs: Date.now() - startedAt,
    };
  }

  const totalAttempts = OPENAI_IMAGE_RETRY_COUNT + 1;
  let lastOutcome: OpenAiShotOutcome = "network_failure";
  let lastStatusCode: number | undefined;
  let lastErrorMessage: string | undefined;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const result = await requestOpenAiImageAttempt(prompt);

    if (result.outcome === "success" && result.imageUrl) {
      return {
        imageUrl: result.imageUrl,
        outcome: "success",
        attemptsUsed: attempt,
        durationMs: Date.now() - startedAt,
      };
    }

    lastOutcome = result.outcome;
    lastStatusCode = result.statusCode;
    lastErrorMessage = result.errorMessage;

    if (attempt < totalAttempts) {
      await sleep(OPENAI_IMAGE_RETRY_DELAY_MS);
    }
  }

  return {
    imageUrl: null,
    outcome: lastOutcome,
    attemptsUsed: totalAttempts,
    statusCode: lastStatusCode,
    errorMessage: lastErrorMessage,
    durationMs: Date.now() - startedAt,
  };
}

const openAiPersonaImageProvider: PersonaImageProvider = {
  async createReferencePack({
    persona,
  }: PersonaImageGenerationInput): Promise<PersonaImageProviderResult[]> {
    return Promise.all(
      SHOT_SPECS.map(async (shot) => {
        const promptUsed = buildShotPrompt(persona, shot);
        const result = await requestOpenAiImageWithRetry(promptUsed);

        if (result.imageUrl) {
          logEvent({
            type: "job_completed",
            domain: "ai",
            action: "generate-reference-pack-shot",
            message: "Persona reference shot generated with OpenAI.",
            metadata: {
              personaId: persona.id,
              shotType: shot.shotType,
              outcome: result.outcome,
              attemptsUsed: result.attemptsUsed,
              durationMs: result.durationMs,
            },
          });
        } else {
          logEvent({
            type: "generation_failed",
            domain: "ai",
            action: "generate-reference-pack-shot",
            message: "OpenAI shot generation failed. Using fallback reference image.",
            metadata: {
              personaId: persona.id,
              shotType: shot.shotType,
              outcome: result.outcome,
              attemptsUsed: result.attemptsUsed,
              durationMs: result.durationMs,
              statusCode: result.statusCode,
              errorMessage: result.errorMessage,
            },
          });
        }

        if (result.imageUrl) {
          return {
            shotType: shot.shotType,
            imageUrl: result.imageUrl,
            promptUsed,
            provider: "openai",
          };
        }

        return {
          shotType: shot.shotType,
          imageUrl: createFallbackImageDataUrl(persona, shot.label),
          promptUsed,
          provider: "mock_fallback",
        };
      }),
    );
  },
};

export async function generatePersonaReferencePack(
  input: PersonaImageGenerationInput,
): Promise<PersonaImageProviderResult[]> {
  logEvent({
    type: "job_started",
    domain: "ai",
    action: "generate-reference-pack",
    message: "Starting persona reference pack generation.",
    metadata: {
      personaId: input.persona.id,
      provider: "openai-first",
      shotCount: SHOT_SPECS.length,
    },
  });

  const results = await openAiPersonaImageProvider.createReferencePack(input);
  const openAiCount = results.filter((item) => item.provider === "openai").length;
  const fallbackCount = results.length - openAiCount;

  logEvent({
    type: "content_generated",
    domain: "ai",
    action: "generate-reference-pack",
    message: "Persona reference pack generation completed.",
    metadata: {
      personaId: input.persona.id,
      total: results.length,
      openAiCount,
      fallbackCount,
      model: OPENAI_IMAGE_MODEL,
      timeoutMs: OPENAI_IMAGE_TIMEOUT_MS,
      retryCount: OPENAI_IMAGE_RETRY_COUNT,
      reasonByShot: results.reduce<Record<string, string>>((acc, entry) => {
        acc[entry.shotType] = entry.provider === "openai" ? "success" : "fallback_used";
        return acc;
      }, {}),
    },
  });

  return results;
}
