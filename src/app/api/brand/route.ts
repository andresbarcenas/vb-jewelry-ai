import { NextResponse } from "next/server";
import {
  getBrandProfile,
  updateBrandProfile,
} from "@/lib/repositories/brand.repository";
import type { BrandProfile } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brand = await getBrandProfile();
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load brand profile.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as BrandProfile;
    const brand = await updateBrandProfile(payload);
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to save brand profile.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
