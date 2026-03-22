import { NextResponse } from "next/server";
import { listContentIdeas } from "@/lib/repositories/content-idea.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ideas = await listContentIdeas();
    return NextResponse.json(ideas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load content ideas.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
