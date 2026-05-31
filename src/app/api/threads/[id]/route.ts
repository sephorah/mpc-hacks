import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = getState();
  const thread = state.getThread(id);

  return NextResponse.json({ messages: thread });
}
