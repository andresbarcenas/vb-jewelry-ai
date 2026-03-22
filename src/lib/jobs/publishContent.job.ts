import { appConfig } from "@/config/app.config";
import { logEvent } from "@/lib/logger";
import { createJobId, waitFor } from "@/lib/jobs/job.utils";
import type { JobResult } from "@/lib/jobs/job.types";
import type { PublishingQueueEntry } from "@/types/studio";

export interface PublishContentJobInput {
  item: PublishingQueueEntry;
}

export interface PublishContentJobOutput {
  itemId: string;
  platform: string;
  published: boolean;
  reason: string;
}

export async function runPublishContentJob(
  input: PublishContentJobInput,
): Promise<JobResult<PublishContentJobOutput>> {
  const jobId = createJobId("job-publish-content");
  const startedAt = new Date().toISOString();

  logEvent({
    type: "job_started",
    domain: "publishing",
    action: "publish-content",
    message: "Starting mocked publish attempt.",
    metadata: {
      jobId,
      itemId: input.item.id,
      platform: input.item.platform,
    },
  });

  await waitFor(260);

  const provider = appConfig.providers.instagram;
  const published = provider.status === "connected";

  const output: PublishContentJobOutput = {
    itemId: input.item.id,
    platform: input.item.platform,
    published,
    reason: published
      ? "Mock publishing completed successfully."
      : "Instagram provider is not connected in this environment.",
  };

  logEvent({
    type: "publishing_attempt",
    domain: "publishing",
    action: "publish-attempt",
    message: output.reason,
    metadata: {
      jobId,
      itemId: input.item.id,
      platform: input.item.platform,
      published: output.published,
    },
  });

  const completedAt = new Date().toISOString();

  logEvent({
    type: "job_completed",
    domain: "publishing",
    action: "publish-content",
    message: "Completed mocked publish attempt job.",
    metadata: {
      jobId,
      itemId: input.item.id,
      success: output.published,
    },
  });

  return {
    jobId,
    jobType: "publish-content",
    status: output.published ? "success" : "failed",
    startedAt,
    completedAt,
    message: output.reason,
    data: output,
  };
}
