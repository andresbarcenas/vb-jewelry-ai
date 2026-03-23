import { NextResponse } from "next/server";
import { enqueueAiJob } from "@/lib/jobs/ai-job-queue";
import { getContentIdeaById } from "@/lib/repositories/content-idea.repository";
import { getPersonaById } from "@/lib/repositories/persona.repository";
import { getProductById } from "@/lib/repositories/product.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface GenerateProductImagesPayload {
  count?: number;
}

function sanitizeCount(raw: unknown) {
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return 3;
  }

  return Math.min(3, Math.max(1, Math.round(raw)));
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as GenerateProductImagesPayload;
    const idea = await getContentIdeaById(id);

    if (!idea) {
      return NextResponse.json({ message: "Content idea not found." }, { status: 404 });
    }

    if (!idea.visualPlan) {
      return NextResponse.json(
        { message: "Generate a visual plan first, then create product images." },
        { status: 400 },
      );
    }

    const persona = await getPersonaById(idea.personaId);
    if (!persona?.primaryReferenceImageUrl) {
      return NextResponse.json(
        {
          message:
            "Please set a primary persona reference image first so the model look stays consistent.",
          reason: "persona_reference_missing",
        },
        { status: 400 },
      );
    }

    if (!idea.productId) {
      return NextResponse.json(
        {
          message:
            "This idea is missing a linked product. Please regenerate from a product-linked idea.",
          reason: "product_missing",
        },
        { status: 400 },
      );
    }

    const product = await getProductById(idea.productId);
    if (!product?.imageDataUrl) {
      return NextResponse.json(
        {
          message:
            "Please upload a clear product reference image in Product Library before generating product-on-person images.",
          reason: "product_reference_missing",
        },
        { status: 400 },
      );
    }

    const job = await enqueueAiJob("product_image_generation", {
      contentIdeaId: id,
      count: sanitizeCount(payload.count),
    });

    return NextResponse.json(
      {
        jobId: job.id,
        type: job.type,
        status: "queued",
        message: "Product images are queued and will be available soon.",
      },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to queue product image generation.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
