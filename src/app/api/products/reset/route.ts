import { NextResponse } from "next/server";
import { resetProducts } from "@/lib/repositories/product.repository";

export const runtime = "nodejs";

export async function POST() {
  try {
    const products = await resetProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to reset products.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
