export type JobType =
  | "generate-content"
  | "generate-visual-plan"
  | "generate-video"
  | "review-content"
  | "publish-content";

export type JobStatus = "success" | "failed";

export interface JobResult<T> {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  startedAt: string;
  completedAt: string;
  message: string;
  data: T;
}
