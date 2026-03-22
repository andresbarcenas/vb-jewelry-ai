import { NextResponse } from "next/server";
import {
  createProduct,
  getProducts,
} from "@/lib/repositories/product.repository";
import type { ProductLibraryItem } from "@/types/studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load products.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProductLibraryItem;
    const products = await createProduct(payload);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create product.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
