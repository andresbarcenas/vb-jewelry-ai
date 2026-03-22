import { logEvent } from "@/lib/logger";
import { createJobId, waitFor } from "@/lib/jobs/job.utils";
import type { JobResult } from "@/lib/jobs/job.types";
import type { VideoReviewItem } from "@/types/studio";

export interface ReviewContentJobInput {
  reviewId: string;
  reviewer: string;
  notes: string;
  action: "approve" | "reject";
}

export interface ReviewContentJobOutput {
  reviewId: string;
  reviewer: string;
  notes: string;
  status: VideoReviewItem["status"];
}

export async function runReviewContentJob(
  input: ReviewContentJobInput,
): Promise<JobResult<ReviewContentJobOutput>> {
  const jobId = createJobId("job-review-content");
  const startedAt = new Date().toISOString();

  const status: VideoReviewItem["status"] =
    input.action === "approve" ? "Approved" : "Changes Requested";

  logEvent({
    type: "job_started",
    domain: "review",
    action: "review-content",
    message: "Starting mocked review decision job.",
    metadata: {
      jobId,
      reviewId: input.reviewId,
      reviewer: input.reviewer,
      action: input.action,
    },
  });

  await waitFor(180);

  logEvent({
    type: input.action === "approve" ? "approval" : "rejection",
    domain: "review",
    action: "review-decision",
    message:
      input.action === "approve"
        ? "Review item approved in mocked workflow."
        : "Review item rejected in mocked workflow.",
    metadata: {
      jobId,
      reviewId: input.reviewId,
      reviewer: input.reviewer,
      notes: input.notes,
    },
  });

  const completedAt = new Date().toISOString();

  logEvent({
    type: "job_completed",
    domain: "review",
    action: "review-content",
    message: "Completed mocked review decision job.",
    metadata: {
      jobId,
      reviewId: input.reviewId,
      status,
    },
  });

  return {
    jobId,
    jobType: "review-content",
    status: "success",
    startedAt,
    completedAt,
    message: "Mock review decision completed.",
    data: {
      reviewId: input.reviewId,
      reviewer: input.reviewer,
      notes: input.notes,
      status,
    },
  };
}
