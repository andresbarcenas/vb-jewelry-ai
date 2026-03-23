import { createJobId, waitFor } from "@/lib/jobs/job.utils";
import type { JobResult } from "@/lib/jobs/job.types";
import { logEvent } from "@/lib/logger";
import {
  buildVisualPlanPrompt,
  generateVisualPlan,
} from "@/lib/services/visual-plan.service";
import type { ContentIdea, VisualPlan } from "@/types/studio";

export interface GenerateVisualPlanJobInput {
  contentIdea: ContentIdea;
}

export interface GenerateVisualPlanJobOutput {
  contentIdeaId: string;
  visualPlan: VisualPlan;
  status: "ready_for_video_phase";
}

export async function runGenerateVisualPlanJob(
  input: GenerateVisualPlanJobInput,
): Promise<JobResult<GenerateVisualPlanJobOutput>> {
  const jobId = createJobId("job-generate-visual-plan");
  const startedAt = new Date().toISOString();
  const prompt = buildVisualPlanPrompt(input.contentIdea);

  logEvent({
    type: "job_started",
    domain: "content",
    action: "generate-visual-plan",
    message: "Starting mocked visual plan generation job.",
    metadata: {
      jobId,
      contentIdeaId: input.contentIdea.id,
      personaName: input.contentIdea.personaName,
      productName: input.contentIdea.productName ?? input.contentIdea.products[0] ?? "",
      promptPreview: prompt.slice(0, 240),
    },
  });

  await waitFor(160);
  const visualPlan = generateVisualPlan(input.contentIdea);
  await waitFor(120);

  const completedAt = new Date().toISOString();

  logEvent({
    type: "content_generated",
    domain: "content",
    action: "visual-plan-generated",
    message: "Visual plan generated for content idea.",
    metadata: {
      jobId,
      contentIdeaId: input.contentIdea.id,
    },
  });

  logEvent({
    type: "job_completed",
    domain: "content",
    action: "generate-visual-plan",
    message: "Completed mocked visual plan generation job.",
    metadata: {
      jobId,
      contentIdeaId: input.contentIdea.id,
    },
  });

  return {
    jobId,
    jobType: "generate-visual-plan",
    status: "success",
    startedAt,
    completedAt,
    message: "Mock visual plan generation completed.",
    data: {
      contentIdeaId: input.contentIdea.id,
      visualPlan,
      status: "ready_for_video_phase",
    },
  };
}
