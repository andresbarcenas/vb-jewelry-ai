import type { JobStatusResponse } from "@/types/studio";

async function requestJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getJobStatus(jobId: string) {
  return requestJson<JobStatusResponse>(`/api/jobs/${jobId}`);
}
