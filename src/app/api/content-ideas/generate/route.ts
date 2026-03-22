import { NextResponse } from "next/server";
import { generateAndSaveContentIdeas } from "@/lib/repositories/content-idea.repository";
import { getPersonaById } from "@/lib/repositories/persona.repository";
import { getProductById } from "@/lib/repositories/product.repository";
import {
  contentMoodOptions,
  contentPlatformOptions,
  contentTypeOptions,
} from "@/lib/services/ai.service";
import type {
  ContentIdeaGeneratorInput,
  ContentIdeaType,
  ContentMood,
  ContentPlatform,
} from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateIdeasPayload {
  personaId?: string;
  productId?: string;
  platform?: ContentPlatform;
  mood?: ContentMood;
  contentType?: ContentIdeaType;
  count?: number;
}

function sanitizeCount(raw: unknown) {
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return 5;
  }

  return Math.min(5, Math.max(3, Math.round(raw)));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GenerateIdeasPayload;

    if (!payload.personaId || !payload.productId) {
      return NextResponse.json(
        { message: "Persona and product are required for content generation." },
        { status: 400 },
      );
    }

    const [persona, product] = await Promise.all([
      getPersonaById(payload.personaId),
      getProductById(payload.productId),
    ]);

    if (!persona || !product) {
      return NextResponse.json(
        {
          message:
            "Could not find the selected persona or product. Refresh and try again.",
        },
        { status: 404 },
      );
    }

    const platformCandidate = payload.platform ?? "Instagram Reels";
    const moodCandidate = payload.mood ?? "Elevated";
    const contentTypeCandidate = payload.contentType ?? "lifestyle";

    const platform = contentPlatformOptions.includes(platformCandidate)
      ? platformCandidate
      : "Instagram Reels";
    const mood = contentMoodOptions.includes(moodCandidate) ? moodCandidate : "Elevated";
    const contentType = contentTypeOptions.includes(contentTypeCandidate)
      ? contentTypeCandidate
      : "lifestyle";

    const input: ContentIdeaGeneratorInput = {
      persona,
      product,
      platform,
      mood,
      contentType,
    };

    const result = await generateAndSaveContentIdeas(input, sanitizeCount(payload.count));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to generate content ideas.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
