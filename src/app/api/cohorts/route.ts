import { getState } from "@/state";
import { NextResponse } from "next/server";

export async function GET() {
  const state = getState();
  const cohorts = state.getAllCohorts();
  const stats = state.getStats();

  return NextResponse.json({ cohorts, stats });
}
