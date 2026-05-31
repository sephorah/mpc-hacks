import { Case, CaseType } from "@/types";
import { GoogleGenAI } from "@google/genai";

const PACKET_RULES = `
Summarize ONLY what the patient wrote above. Draw no conclusion beyond it.
If a bullet has nothing to report from the intake, write "Not reported" — never infer or invent.
Do NOT: judge appropriateness, recommend or decide treatment, decide routing or channel
(async vs live), or assign any flag or acuity level. Routing and flag are set by
deterministic rules and shown separately — restating them here is an error.
Each bullet ≤ 30 words. No intro line, no markdown headers. Clinician-facing.`;

const PROMPTS: Record<CaseType, (c: Case) => string> = {
  "med-renewal": (c) =>
    `You summarize a prescription-renewal intake into a brief for the prescribing clinician.

Patient intake: ${c.freeText}

Write exactly 3 bullets, each starting with •:
- Medication: the drug, dose, and frequency the patient asks to renew, as stated
- Reported context: time on the medication, side effects, reason for renewal — patient's words only
- Relevant detail: any patient-reported readings or history in the intake, reproduced factually
${PACKET_RULES}`,

  "lab-followup": (c) =>
    `You summarize a lab-follow-up intake into a brief for the reviewing clinician.

Patient intake: ${c.freeText}

Write exactly 3 bullets, each starting with •:
- Test: which lab or result the follow-up concerns and the context the patient gives
- Reported values: any values the patient states, reproduced verbatim — do NOT label them normal or abnormal
- Relevant detail: symptoms or history the patient mentions alongside the lab
${PACKET_RULES}`,

  "chronic-condition-check-in": (c) =>
    `You summarize a chronic-condition check-in into a brief for the reviewing clinician.

Patient intake: ${c.freeText}

Write exactly 3 bullets, each starting with •:
- Condition: the condition being monitored and the patient's reported status
- Reported measurements: values the patient provides (BP, glucose, etc.), reproduced factually — do NOT judge control
- Relevant detail: adherence, symptoms, or changes the patient mentions
${PACKET_RULES}`,

  "general-enquiry": (c) =>
    `You summarize a general patient enquiry into a brief for the reviewing clinician.

Patient intake: ${c.freeText}

Write exactly 3 bullets, each starting with •:
- Concern: what the patient is asking about, in their words
- Reported detail: relevant context — duration, symptoms, prior steps tried
- Other notes: anything else in the intake the clinician should see, reproduced factually
${PACKET_RULES}`
};

// Deterministic, model-free brief. This is what makes the safety line true:
// no key, empty response, or API error → the clinician still gets something to attest to.
function fallbackPacket(c: Case): string {
  const status = c.missing
    ? `• Status: missing ${c.missing} — see intake above`
    : `• Status: all required items present`;
  return [
    `• Intake: ${c.freeText}`,
    status,
    `• Note: automated summary unavailable — review the raw intake and attest.`
  ].join("\n");
}

export async function generatePacket(caseObj: Case): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackPacket(caseObj);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = PROMPTS[caseObj.type](caseObj);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.text?.trim();
    if (!text) return fallbackPacket(caseObj);
    return text;
  } catch {
    return fallbackPacket(caseObj);
  }
}
