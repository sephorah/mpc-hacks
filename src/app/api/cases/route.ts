import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";
import { CaseStatus } from "@/state";

export async function GET(request: NextRequest) {
  const state = getState();
  const status = request.nextUrl.searchParams.get("status");

  const cases = status
    ? state.getCasesByStatus(status as CaseStatus)
    : state.getAllCases();

  return NextResponse.json({ cases });
}
