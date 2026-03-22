export type StudioLogType =
  | "content_generated"
  | "generation_failed"
  | "approval"
  | "rejection"
  | "publishing_attempt"
  | "job_started"
  | "job_completed";

export type StudioLogDomain =
  | "ai"
  | "content"
  | "video"
  | "publishing"
  | "review"
  | "analytics"
  | "system";

export interface StudioLogEvent {
  type: StudioLogType;
  domain: StudioLogDomain;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface StudioLogRecord extends StudioLogEvent {
  timestamp: string;
}

const logHistory: StudioLogRecord[] = [];

export function logEvent(event: StudioLogEvent) {
  const record: StudioLogRecord = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  logHistory.push(record);

  // Structured logs make it easy to route these events to a real provider later.
  console.info("[studio-log]", JSON.stringify(record));

  return record;
}

export function getLogHistory() {
  return [...logHistory];
}

export function clearLogHistory() {
  logHistory.length = 0;
}
