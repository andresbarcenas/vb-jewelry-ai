import { NextResponse } from "next/server";
import { setPersonaReferenceAssetApproval } from "@/lib/repositories/persona.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{
    id: string;
    assetId: string;
  }>;
}

interface ApprovalPayload {
  approved?: boolean;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, assetId } = await params;
    const payload = (await request.json()) as ApprovalPayload;
    const approved = payload.approved === true;
    const persona = await setPersonaReferenceAssetApproval(id, assetId, approved);

    if (!persona) {
      return NextResponse.json(
        { message: "Persona asset not found for this persona." },
        { status: 404 },
      );
    }

    return NextResponse.json(persona);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update reference approval.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
