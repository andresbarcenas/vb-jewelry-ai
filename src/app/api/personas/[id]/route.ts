import { NextResponse } from "next/server";
import {
  deletePersona,
  updatePersona,
} from "@/lib/repositories/persona.repository";
import type { AiPersonaProfile } from "@/types/studio";

export const runtime = "nodejs";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as AiPersonaProfile;
    const personas = await updatePersona({
      ...payload,
      id,
    });

    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update persona.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const personas = await deletePersona(id);
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete persona.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
