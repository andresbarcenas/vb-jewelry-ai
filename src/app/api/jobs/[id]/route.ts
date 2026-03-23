import { NextResponse } from "next/server";
import { getAiJob } from "@/lib/jobs/ai-job-queue";
import type { JobStatusResponse } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const job = await getAiJob(id);

    if (!job) {
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    const response: JobStatusResponse = {
      jobId: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      message: job.message,
      error: job.error,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      updatedAt: job.updatedAt,
      metadata: job.metadata,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to read job status.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
