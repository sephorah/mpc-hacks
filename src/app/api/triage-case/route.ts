import { GoogleGenerativeAI } from "@google/generative-ai";
import { getState } from "@/state";
import { type NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a medical case triage system. Analyze the patient intake form data and generate a structured case object.

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

    const formDataStr = JSON.stringify({
      patientName: patientCase.patientName,
      message: patientCase.freeText,
    }, null, 2);

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // Fallback
      state.updateCaseFromTriage(caseId!, {
        lane: "async-ready",
        type: "renewal",
        redFlags: false,
        missing: null,
        freeText: patientCase.freeText,
      });
      return NextResponse.json({ success: true, fallback: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(
      `Patient Form Data:\n${formDataStr}`
    );

    const jsonText = result.response.text().trim();
    const triageResult = JSON.parse(jsonText);

    state.updateCaseFromTriage(caseId!, triageResult);

    return NextResponse.json({ success: true, triageResult });
  } catch (error) {
    console.error("AI Triage Error:", error);
    if (caseId) {
      const state = getState();
      const c = state.getCase(caseId);
      if (c) {
        state.updateCaseFromTriage(caseId, {
          lane: "needs-sync",
          type: "renewal",
          redFlags: true,
          missing: null,
          freeText: "Error during triage. Escalating for safety.",
        });
      }
    }
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
