import { NextResponse } from "next/server";
import { resetBrandProfile } from "@/lib/repositories/brand.repository";

export const runtime = "nodejs";

export async function POST() {
  try {
    const brand = await resetBrandProfile();
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to reset brand profile.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
