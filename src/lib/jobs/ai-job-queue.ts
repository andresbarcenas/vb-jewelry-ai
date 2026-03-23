import { logEvent } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import type {
  AiJobPayloadMap,
  AiJobRecord,
  AiJobType,
} from "@/types/studio";

const JOB_QUEUE_KEY = "vb-jewelry-ai:queue:jobs";
const JOB_DELAYED_KEY = "vb-jewelry-ai:queue:delayed";
const JOB_KEY_PREFIX = "vb-jewelry-ai:job";

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getAiQueueConfig() {
  return {
    pollIntervalMs: parsePositiveInteger(process.env.AI_QUEUE_POLL_INTERVAL_MS, 5000),
    maxAttempts: parsePositiveInteger(process.env.AI_JOB_MAX_ATTEMPTS, 3),
    backoffMs: parsePositiveInteger(process.env.AI_JOB_BACKOFF_MS, 4000),
  };
}

function getJobKey(jobId: string) {
  return `${JOB_KEY_PREFIX}:${jobId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function buildJobId(type: AiJobType) {
  return `job-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

function ensureRedisClient() {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error("REDIS_URL is not configured. Background AI queue is unavailable.");
  }

  return redis;
}

function parseJobRecord(raw: string | null): AiJobRecord | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AiJobRecord;
  } catch {
    return null;
  }
}

export async function enqueueAiJob<TType extends AiJobType>(
  type: TType,
  payload: AiJobPayloadMap[TType],
) {
  const redis = ensureRedisClient();
  const config = getAiQueueConfig();
  const jobId = buildJobId(type);
  const timestamp = nowIso();

  const job: AiJobRecord<AiJobPayloadMap[TType]> = {
    id: jobId,
    type,
    status: "queued",
    payload,
    attempts: 0,
    maxAttempts: config.maxAttempts,
    message: "Queued. Processing will start shortly.",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await redis.multi().set(getJobKey(job.id), JSON.stringify(job)).lpush(JOB_QUEUE_KEY, job.id).exec();

  logEvent({
    type: "job_enqueued",
    domain: "ai",
    action: `enqueue-${type}`,
    message: "AI generation job enqueued.",
    metadata: {
      jobId: job.id,
      jobType: type,
    },
  });

  return job;
}

export async function getAiJob(jobId: string) {
  const redis = ensureRedisClient();
  const raw = await redis.get(getJobKey(jobId));
  return parseJobRecord(raw);
}

async function saveAiJob(job: AiJobRecord) {
  const redis = ensureRedisClient();
  await redis.set(getJobKey(job.id), JSON.stringify(job));
}

export async function moveDueAiJobsToQueue() {
  const redis = ensureRedisClient();
  const now = Date.now();
  const dueJobIds = await redis.zrangebyscore(JOB_DELAYED_KEY, "-inf", now, "LIMIT", 0, 20);

  if (dueJobIds.length === 0) {
    return 0;
  }

  const pipeline = redis.multi();
  dueJobIds.forEach((jobId) => {
    pipeline.zrem(JOB_DELAYED_KEY, jobId);
    pipeline.lpush(JOB_QUEUE_KEY, jobId);
  });
  await pipeline.exec();

  return dueJobIds.length;
}

export async function popNextQueuedAiJob() {
  const redis = ensureRedisClient();
  const jobId = await redis.rpop(JOB_QUEUE_KEY);

  if (!jobId) {
    return null;
  }

  const job = await getAiJob(jobId);
  if (!job) {
    return null;
  }

  const availableAtTimestamp = job.availableAt ? toTimestamp(job.availableAt) : Date.now();
  if (availableAtTimestamp > Date.now()) {
    await redis.zadd(JOB_DELAYED_KEY, availableAtTimestamp, job.id);
    return null;
  }

  return job;
}

export async function markAiJobStarted(job: AiJobRecord) {
  const timestamp = nowIso();
  const updated: AiJobRecord = {
    ...job,
    status: "processing",
    attempts: job.attempts + 1,
    message: "Processing started.",
    startedAt: timestamp,
    updatedAt: timestamp,
  };

  await saveAiJob(updated);

  logEvent({
    type: "job_started",
    domain: "ai",
    action: `start-${job.type}`,
    message: "AI generation job started.",
    metadata: {
      jobId: job.id,
      jobType: job.type,
      attempt: updated.attempts,
    },
  });

  return updated;
}

export async function markAiJobCompleted(
  job: AiJobRecord,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const timestamp = nowIso();
  const updated: AiJobRecord = {
    ...job,
    status: "completed",
    message,
    metadata,
    error: undefined,
    completedAt: timestamp,
    updatedAt: timestamp,
  };

  await saveAiJob(updated);

  logEvent({
    type: "job_completed",
    domain: "ai",
    action: `complete-${job.type}`,
    message,
    metadata: {
      jobId: job.id,
      jobType: job.type,
      ...metadata,
    },
  });

  return updated;
}

export async function markAiJobFailed(
  job: AiJobRecord,
  errorMessage: string,
  metadata?: Record<string, unknown>,
  options?: {
    disableRetry?: boolean;
  },
) {
  const redis = ensureRedisClient();
  const config = getAiQueueConfig();
  const canRetry = !options?.disableRetry && job.attempts < job.maxAttempts;

  if (canRetry) {
    const retryDelay = config.backoffMs * Math.max(1, job.attempts);
    const availableAt = new Date(Date.now() + retryDelay).toISOString();
    const queuedJob: AiJobRecord = {
      ...job,
      status: "queued",
      message: "Retry scheduled after a temporary failure.",
      error: errorMessage,
      availableAt,
      updatedAt: nowIso(),
      metadata,
    };

    await redis
      .multi()
      .set(getJobKey(job.id), JSON.stringify(queuedJob))
      .zadd(JOB_DELAYED_KEY, toTimestamp(availableAt), job.id)
      .exec();

    logEvent({
      type: "job_retry",
      domain: "ai",
      action: `retry-${job.type}`,
      message: "AI job failed and was re-queued.",
      metadata: {
        jobId: job.id,
        jobType: job.type,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        retryDelayMs: retryDelay,
        failure: errorMessage,
        ...metadata,
      },
    });

    return queuedJob;
  }

  const failedJob: AiJobRecord = {
    ...job,
    status: "failed",
    message: "Generation failed. Please try again.",
    error: errorMessage,
    completedAt: nowIso(),
    updatedAt: nowIso(),
    metadata,
  };

  await saveAiJob(failedJob);

  logEvent({
    type: "job_failed",
    domain: "ai",
    action: `fail-${job.type}`,
    message: "AI job failed after retries.",
    metadata: {
      jobId: job.id,
      jobType: job.type,
      attempts: failedJob.attempts,
      maxAttempts: failedJob.maxAttempts,
      failure: errorMessage,
      ...metadata,
    },
  });

  return failedJob;
}
