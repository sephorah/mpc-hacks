import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = getState();

    // Server-side Layer 1 validation
    const redFlags = state.validateLayer1(body);

    // Submit the case (this also runs clustering + Layer 2)
    const patientCase = state.submitCase(body);

    return NextResponse.json({
      success: true,
      case: patientCase,
      escalated: redFlags.length > 0,
      redFlags,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 },
    );
  }
}
