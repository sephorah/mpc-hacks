import { Case, CaseType, Lane } from "@/types";

const GEMINI_MODEL = "gemini-1.5-flash";

interface GeminiResponse {
  type: CaseType;
  lane: Lane;
  redFlags: boolean;
  missing: string | null;
  freeText: string;
}

export async function convertFormToCase(
  formData: Record<string, unknown>,
  patientId: string
): Promise<Case> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = buildPrompt(formData);

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.contents?.[0]?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content returned from Gemini");
  }

  const parsed: GeminiResponse = JSON.parse(content);

  return {
    id: `${patientId}-${Date.now()}`,
    type: parsed.type,
    lane: parsed.lane,
    redFlags: parsed.redFlags,
    missing: parsed.missing,
    freeText: parsed.freeText,
    packet: null,
    status: "open",
    createdAt: Date.now(),
    closedAt: null,
  };
}

function buildPrompt(formData: Record<string, unknown>): string {
  const formDataStr = JSON.stringify(formData, null, 2);

  return `You are a medical case triage system. Analyze the patient intake form data and generate a structured case object.

Patient Form Data:
${formDataStr}

Based on this form data, respond with ONLY a valid JSON object (no markdown formatting, no extra text) with these exact fields:

{
  "type": "renewal" | "lab-followup",
  "lane": "needs-sync" | "async-pending" | "async-ready",
  "redFlags": boolean,
  "missing": string | null,
  "freeText": string
}

Field definitions:
- type: The case type (renewal for prescription renewals, lab-followup for lab-related cases)
- lane: 
  * "needs-sync": Red flag / urgent - requires live visit
  * "async-pending": Closeable async but missing something (lab results, documentation, etc.)
  * "async-ready": Complete and ready for provider to close
- redFlags: true if any urgent/critical flags are present
- missing: What's blocking closure (e.g., "lab result", "provider signature"), or null if nothing is missing
- freeText: A concise summary of the case for the provider (2-3 sentences)

Respond with ONLY the JSON object, nothing else.`;
}
