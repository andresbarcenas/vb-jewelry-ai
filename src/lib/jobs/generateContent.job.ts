import { generateContentIdeas } from "@/lib/services/ai.service";
import { logEvent } from "@/lib/logger";
import { createJobId, waitFor } from "@/lib/jobs/job.utils";
import type { JobResult } from "@/lib/jobs/job.types";
import type { ContentIdeaGeneratorInput, GeneratedContentIdeaCard } from "@/types/studio";

export async function runGenerateContentJob(
  input: ContentIdeaGeneratorInput,
  count = 5,
): Promise<JobResult<GeneratedContentIdeaCard[]>> {
  const jobId = createJobId("job-generate-content");
  const startedAt = new Date().toISOString();

  logEvent({
    type: "job_started",
    domain: "content",
    action: "generate-content",
    message: "Starting mocked content generation job.",
    metadata: {
      jobId,
      personaId: input.persona.id,
      productId: input.product.id,
      contentType: input.contentType,
    },
  });

  await waitFor(220);
  const ideas = await generateContentIdeas(input, count);
  await waitFor(120);

  const completedAt = new Date().toISOString();

  logEvent({
    type: "content_generated",
    domain: "content",
    action: "generate-ideas",
    message: `Generated ${ideas.length} mock content ideas.`,
    metadata: {
      jobId,
      personaId: input.persona.id,
      productId: input.product.id,
    },
  });

  logEvent({
    type: "job_completed",
    domain: "content",
    action: "generate-content",
    message: "Completed mocked content generation job.",
    metadata: {
      jobId,
      resultCount: ideas.length,
    },
  });

  return {
    jobId,
    jobType: "generate-content",
    status: "success",
    startedAt,
    completedAt,
    message: "Mock content generation completed.",
    data: ideas,
  };
}
