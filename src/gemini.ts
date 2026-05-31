import { Case, CaseType } from "@/types";
import { GoogleGenAI } from "@google/genai";

const PROMPTS: Record<CaseType, (c: Case) => string> = {
  "med-renewal": (c) =>
    `You are a clinical decision-support assistant reviewing a prescription renewal request.

Patient intake: ${c.freeText}
Red flags detected: ${c.redFlags}
Missing information: ${c.missing ?? "none"}

Write a decision packet for the prescribing clinician as exactly 4 bullet points. Start each bullet with •.
• Complaint: chief complaint and current medication context
• Assessment: renewal appropriateness — stable indications, contraindications, side-effect check
• Action: approve renewal / hold pending info / escalate
• Flag: green (routine renewal) | yellow (review needed) | red (urgent concern)

Each bullet ≤35 words. No prose, no intro sentence, no markdown headers. Clinician-facing.`,

  "lab-followup": (c) =>
    `You are a clinical decision-support assistant reviewing a lab follow-up case.

Patient intake: ${c.freeText}
Red flags detected: ${c.redFlags}
Missing information: ${c.missing ?? "none"}

Write a decision packet for the reviewing clinician as exactly 4 bullet points. Start each bullet with •.
• Labs: what is being followed up and the clinical context
• Results: what results suggest (if mentioned) or whether they are missing
• Action: acknowledge normal / flag abnormal / request missing results / escalate
• Flag: green (results in normal range) | yellow (borderline or missing) | red (critical value)

Each bullet ≤35 words. No prose, no intro sentence, no markdown headers. Clinician-facing.`,

  "chronic-condition-check-in": (c) =>
    `You are a clinical decision-support assistant reviewing a chronic condition check-in.

Patient intake: ${c.freeText}
Red flags detected: ${c.redFlags}
Missing information: ${c.missing ?? "none"}

Write a decision packet for the reviewing clinician as exactly 4 bullet points. Start each bullet with •.
• Condition: condition being monitored and current patient-reported status
• Measurements: whether recent data supports the current care plan
• Action: continue plan / adjust medication / request measurements / escalate
• Flag: green (stable, on-target) | yellow (borderline or measurements missing) | red (out-of-control or worsening)

Each bullet ≤35 words. No prose, no intro sentence, no markdown headers. Clinician-facing.`,

  "general-enquiry": (c) =>
    `You are a clinical decision-support assistant reviewing a general patient enquiry.

Patient intake: ${c.freeText}
Red flags detected: ${c.redFlags}

Write a decision packet for the reviewing clinician as exactly 4 bullet points. Start each bullet with •.
• Complaint: chief complaint and patient concern
• Channel: whether the concern can be addressed async or requires a live visit
• Action: suggested next step
• Flag: green (informational / low acuity) | yellow (needs provider input) | red (urgent)

Each bullet ≤35 words. No prose, no intro sentence, no markdown headers. Clinician-facing.`,
};

export async function generatePacket(caseObj: Case): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = PROMPTS[caseObj.type](caseObj);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text?.trim();
  if (!text) throw new Error("No content from Gemini");
  return text;
}
