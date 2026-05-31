import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const body = await request.json();
  const state = getState();

  const { doctorId, attestations } = body as {
    doctorId: string;
    attestations: { caseId: string; notes: string }[];
  };

  if (!attestations || !Array.isArray(attestations)) {
    return NextResponse.json(
      { error: "attestations array required" },
      { status: 400 },
    );
  }

  const resolved = state.attestCohort(decodedId, doctorId ?? "Provider", attestations);

  return NextResponse.json({
    success: true,
    resolvedCount: resolved.length,
    cases: resolved,
  });
}
