import { generatePacket } from "@/gemini";
import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";
import type { CaseType } from "@/types";

// Set USE_AI=true in .env.local to call Gemini. Default: mock data (no credits used).
const USE_AI = process.env.USE_AI === "true";

const MOCK_PACKETS: Record<CaseType, string> = {
  "med-renewal": [
    "• Complaint: Stable long-term prescription renewal. No new symptoms or adverse reactions reported.",
    "• Assessment: Current indications remain valid. No contraindications identified. Side-effect profile unchanged.",
    "• Action: Approve renewal. No lab work or in-person visit required at this time.",
    "• Flag: Green — routine renewal. Standard 90-day supply appropriate.",
  ].join("\n"),

  "lab-followup": [
    "• Labs: Routine follow-up for previously ordered bloodwork. Patient reports no new symptoms.",
    "• Results: Results pending upload to patient account. No critical values flagged by ordering facility.",
    "• Action: Request patient to upload results; review once received before closing.",
    "• Flag: Yellow — results not yet available. Hold until uploaded.",
  ].join("\n"),

  "chronic-condition-check-in": [
    "• Condition: Ongoing chronic condition monitoring. Patient reports stable status since last check-in.",
    "• Measurements: Recent self-reported measurements within expected range per care plan targets.",
    "• Action: Continue current care plan. Schedule follow-up in 3 months unless symptoms change.",
    "• Flag: Green — stable and on-target. No medication adjustments required.",
  ].join("\n"),

  "general-enquiry": [
    "• Complaint: General health question submitted for provider review. No emergency indicators.",
    "• Channel: Concern appears suitable for async response. No red flags requiring urgent in-person care.",
    "• Action: Provide informational response or redirect to appropriate care pathway.",
    "• Flag: Yellow — needs provider input before closing.",
  ].join("\n"),
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  const { id } = req.query;
  const caseObj = getState().cases.get(String(id));

  if (!caseObj) {
    res.status(404).json({ success: false, message: "Case not found" });
    return;
  }

  if (caseObj.packet) {
    res.status(200).json({ success: true, data: caseObj });
    return;
  }

  if (USE_AI) {
    try {
      caseObj.packet = await generatePacket(caseObj);
    } catch (err) {
      console.error("Gemini packet error:", err);
      caseObj.packet = MOCK_PACKETS[caseObj.type];
    }
  } else {
    // Simulate a brief async delay so the UI spinner is visible during demo
    await new Promise((r) => setTimeout(r, 600));
    caseObj.packet = MOCK_PACKETS[caseObj.type];
  }

  res.status(200).json({ success: true, data: caseObj });
}
