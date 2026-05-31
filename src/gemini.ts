import { Case, CaseType, Lane } from "@/types";
import {
  GoogleGenAI,
  ThinkingLevel,
} from '@google/genai';


const GEMINI_MODEL = "gemini-1.5-flash";

interface GeminiResponse {
  type: CaseType;
  lane: Lane;
  redFlags: boolean;
  missing: string | null;
  freeText: string;
}

export async function convertFormToCase(
  formData: Record<string, string>,
  patientId: string
): Promise<Case> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = buildPrompt(formData);

  const ai = new GoogleGenAI({
    apiKey: process.env['GEMINI_API_KEY'],
  });
  const config = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
  };
  const model = 'gemini-2.0-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  
  let content = "";
  for await (const chunk of response) {
    if (chunk.text) {
      console.log(chunk.text);
      content += chunk.text;
    }
  }

  if (!content) {
    throw new Error("No content returned from Gemini");
  }

  const parsed: GeminiResponse = JSON.parse(content);

  return {
    patient_id: patientId,
    id: crypto.randomUUID(),
    type: parsed.type,
    lane: parsed.lane,
    answers: {},
    redFlags: parsed.redFlags,
    missing: parsed.missing,
    freeText: parsed.freeText,
    packet: null,
    status: "open",
    cohortId: null,
    createdAt: Date.now(),
    closedAt: null,
    escalatedAt: null,
  };
}

function buildPrompt(formData: Record<string, string>): string {
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

Low-priority cases such as simple symptoms like coughs or headaches should fall into the async category.
Cases with considerable nuance that require personal communication to determine the correct course of action should fall into the sync category.
This includes situations such as mental health enquiries, checkups and follow ups with a provider, and situations where text responses do not remedy the situation.

Async Examples:
"I need to renew my routine prescription for my Ventolin asthma inhaler. My asthma has been completely stable for the last six months, I haven't had any sudden flare-ups or changes in my breathing, and I'm not experiencing any new side effects. My current pharmacy fax number is already saved on file in my app profile."
"I recently had my routine fasting blood work done last Tuesday for my annual cholesterol monitoring check, and I see the official lab report PDF has already successfully uploaded to my account here. I just need a provider to review it and let me know if my current Lipitor dose is still working as intended."

Sync Examples:
"I need a standard renewal on my heart medication, but lately, I've been feeling an uncomfortable tightness and heavy pressure in my chest. It started a couple of days ago and it's making me a bit short of breath even when I'm just sitting on the couch trying to relax."
"I'm looking to review my recent blood tests regarding my chronic fatigue, but I also really need a full checkup session with my provider. My anxiety and overall mental health have been declining severely alongside my physical energy over the past month, and text messages aren't going to cut it for this conversation."

Respond with ONLY the JSON object, nothing else.`;
}
