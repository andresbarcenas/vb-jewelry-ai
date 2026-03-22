import { NextResponse } from "next/server";
import {
  deleteProduct,
  updateProduct,
} from "@/lib/repositories/product.repository";
import type { ProductLibraryItem } from "@/types/studio";

export const runtime = "nodejs";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as ProductLibraryItem;
    const products = await updateProduct({
      ...payload,
      id,
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update product.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const products = await deleteProduct(id);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete product.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
