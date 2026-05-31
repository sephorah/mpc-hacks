import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = getState();
  const c = state.getCase(id);

  if (!c) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({ case: c });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const state = getState();

  if (body.action === "attest") {
    const c = state.attestCase(id, body.doctorId ?? "Provider", body.notes ?? "");
    if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ success: true, case: c });
  }

  if (body.action === "escalate") {
    const c = state.escalateCase(id, body.reason ?? "Provider escalation");
    if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ success: true, case: c });
  }

  if (body.action === "update_summary") {
    state.updateSummary(id, body.summary ?? "");
    const c = state.getCase(id);
    if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ success: true, case: c });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
