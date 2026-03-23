import { NextResponse } from "next/server";
import { enqueueAiJob } from "@/lib/jobs/ai-job-queue";
import { getPersonaById } from "@/lib/repositories/persona.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const persona = await getPersonaById(id);

    if (!persona) {
      return NextResponse.json({ message: "Persona not found." }, { status: 404 });
    }

    const job = await enqueueAiJob("persona_reference_pack", {
      personaId: persona.id,
    });

    return NextResponse.json(
      {
        jobId: job.id,
        type: job.type,
        status: "queued",
        message: "Reference pack queued. Images will be available soon.",
      },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to generate persona reference pack.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
