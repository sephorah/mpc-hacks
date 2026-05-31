import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const state = getState();
  const cohort = state.getCohortWithCases(decodedId);

  if (!cohort) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
  }

  return NextResponse.json({ cohort });
}
