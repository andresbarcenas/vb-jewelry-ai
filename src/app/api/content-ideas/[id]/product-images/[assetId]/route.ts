import { NextResponse } from "next/server";
import { enqueueAiJob } from "@/lib/jobs/ai-job-queue";
import { getContentIdeaById } from "@/lib/repositories/content-idea.repository";
import { getPersonaById } from "@/lib/repositories/persona.repository";
import { getProductById } from "@/lib/repositories/product.repository";
import { updateProductImageAssetStatus } from "@/lib/repositories/content-idea.repository";
import type { ProductImageAssetStatus } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
    assetId: string;
  }>;
}

interface ProductImageAssetActionPayload {
  action?: "approve" | "discard" | "regenerate";
}

function toStatus(action: "approve" | "discard"): ProductImageAssetStatus {
  return action === "approve" ? "approved" : "discarded";
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, assetId } = await params;
    const payload = (await request.json()) as ProductImageAssetActionPayload;

    if (!payload.action) {
      return NextResponse.json({ message: "An action is required." }, { status: 400 });
    }

    if (payload.action === "regenerate") {
      const idea = await getContentIdeaById(id);
      if (!idea) {
        return NextResponse.json({ message: "Content idea not found." }, { status: 404 });
      }

      if (!idea.visualPlan) {
        return NextResponse.json(
          {
            message: "Generate a visual plan first, then create product images.",
            reason: "visual_plan_missing",
          },
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
        count: 1,
        replaceAssetId: assetId,
      });

      return NextResponse.json(
        {
          jobId: job.id,
          type: job.type,
          status: "queued",
          message: "Product image regeneration is queued and will be available soon.",
        },
        { status: 202 },
      );
    }

    const updated = await updateProductImageAssetStatus(id, assetId, toStatus(payload.action));

    if (!updated) {
      return NextResponse.json(
        { message: "Product image asset not found for this idea." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      idea: updated,
      message:
        payload.action === "approve"
          ? "Product image approved."
          : "Product image discarded.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update product image asset.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
