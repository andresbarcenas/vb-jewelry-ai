import { NextResponse } from "next/server";
import { enqueueAiJob } from "@/lib/jobs/ai-job-queue";
import {
  generateVisualPlanForIdea,
  updateContentIdeaStatus,
} from "@/lib/repositories/content-idea.repository";
import type { ContentIdeaStatus } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateIdeaPayload {
  action?:
    | "save"
    | "ready_for_review"
    | "send_to_review"
    | "archive"
    | "regenerate"
    | "generate_visual_plan";
}

function mapStatus(
  action: "save" | "ready_for_review" | "send_to_review" | "archive",
): ContentIdeaStatus {
  if (action === "save") {
    return "Saved";
  }

  if (action === "ready_for_review" || action === "send_to_review") {
    return "Ready for Review";
  }

  return "Archived";
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as UpdateIdeaPayload;

    if (!payload.action) {
      return NextResponse.json(
        { message: "An action is required." },
        { status: 400 },
      );
    }

    if (payload.action === "regenerate") {
      const job = await enqueueAiJob("content_regeneration", {
        ideaId: id,
      });

      return NextResponse.json(
        {
          jobId: job.id,
          type: job.type,
          status: "queued",
          message: "Idea regeneration queued. Updated concept will be available soon.",
        },
        { status: 202 },
      );
    }

    if (payload.action === "generate_visual_plan") {
      const updated = await generateVisualPlanForIdea(id);

      if (!updated) {
        return NextResponse.json(
          { message: "Idea not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        idea: updated,
        source: "mock_fallback",
        message: "Visual plan generated. Video is still in draft until a video provider is connected.",
      });
    }

    const updated = await updateContentIdeaStatus(id, mapStatus(payload.action));

    if (!updated) {
      return NextResponse.json(
        { message: "Idea not found." },
        { status: 404 },
      );
    }

    const message =
      payload.action === "ready_for_review" || payload.action === "send_to_review"
        ? "Idea marked as ready for review."
        : "Idea updated.";

    return NextResponse.json({
      idea: updated,
      source: "openai",
      message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update content idea.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
