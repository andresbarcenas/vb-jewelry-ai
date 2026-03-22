import { logEvent } from "@/lib/logger";
import { createJobId, waitFor } from "@/lib/jobs/job.utils";
import type { JobResult } from "@/lib/jobs/job.types";

export interface GenerateVideoJobInput {
  contentTitle: string;
  personaName: string;
  productName: string;
}

export interface GenerateVideoJobOutput {
  videoId: string;
  status: "review_ready";
  duration: string;
  renderSummary: string;
}

export async function runGenerateVideoJob(
  input: GenerateVideoJobInput,
): Promise<JobResult<GenerateVideoJobOutput>> {
  const jobId = createJobId("job-generate-video");
  const startedAt = new Date().toISOString();

  logEvent({
    type: "job_started",
    domain: "video",
    action: "generate-video",
    message: "Starting mocked video generation job.",
    metadata: {
      jobId,
      contentTitle: input.contentTitle,
      personaName: input.personaName,
      productName: input.productName,
    },
  });

  await waitFor(420);

  const data: GenerateVideoJobOutput = {
    videoId: createJobId("video"),
    status: "review_ready",
    duration: "00:18",
    renderSummary:
      "Mock render complete. The clip is marked review-ready for the editorial queue.",
  };

  const completedAt = new Date().toISOString();

  logEvent({
    type: "job_completed",
    domain: "video",
    action: "generate-video",
    message: "Completed mocked video generation job.",
    metadata: {
      jobId,
      videoId: data.videoId,
      status: data.status,
    },
  });

  return {
    jobId,
    jobType: "generate-video",
    status: "success",
    startedAt,
    completedAt,
    message: "Mock video generation completed.",
    data,
  };
}
