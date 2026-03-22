import { NextResponse } from "next/server";
import {
  createPersona,
  getPersonas,
} from "@/lib/repositories/persona.repository";
import type { AiPersonaProfile } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const personas = await getPersonas();
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load personas.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AiPersonaProfile;
    const personas = await createPersona(payload);
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create persona.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
