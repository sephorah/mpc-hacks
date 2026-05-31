import { GoogleGenerativeAI } from "@google/generative-ai";
import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an automated medical transcriber. Your ONLY role is to read the patient's unstructured free-text commentary, analyze it, and condense it into a fast, simple bulleted list for quick readability.
CRITICAL: You must NEVER diagnose the patient, NEVER suggest medications, NEVER evaluate clinical risk, and NEVER generate outbound message content to the patient. Extract raw text summaries only into bullet points. Use standard markdown dash (-) for bullets.`;

export async function POST(request: NextRequest) {
  let caseId: string | null = null;
  try {
    const body = await request.json();
    caseId = body.caseId;
    
    const state = getState();
    const patientCase = state.getCase(caseId!);

    if (!patientCase) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 },
      );
    }

    if (!patientCase.freeText || patientCase.freeText.trim().length === 0) {
      return NextResponse.json(
        { success: true, summary: "No additional context provided." },
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("API Key loaded:", !!apiKey);
    if (!apiKey) {
      // Fallback: generate a basic summary without AI
      const summary = patientCase.freeText.length > 60
        ? `${patientCase.freeText.substring(0, 57)}...`
        : patientCase.freeText;
      state.updateSummary(caseId!, summary);
      return NextResponse.json({ success: true, summary, fallback: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
      `Analyze and condense this patient commentary into simple bullet points:\n\n"${patientCase.freeText}"`,
    );

    const summary = result.response.text().trim();
    state.updateSummary(caseId!, summary);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("AI Error:", error);
    // On AI failure, use truncated text as fallback
    if (caseId) {
      const state = getState();
      const c = state.getCase(caseId);
      if (c) {
        const fallback = c.freeText.length > 60 ? `${c.freeText.substring(0, 57)}...` : c.freeText;
        state.updateSummary(caseId, fallback);
        return NextResponse.json({ success: true, summary: fallback, fallback: true });
      }
    }
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
