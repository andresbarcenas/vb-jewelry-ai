import { NextResponse } from "next/server";
import { resetPersonas } from "@/lib/repositories/persona.repository";

export const runtime = "nodejs";

export async function POST() {
  try {
    const personas = await resetPersonas();
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to reset personas.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
