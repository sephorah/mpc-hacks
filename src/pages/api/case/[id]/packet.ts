import { generatePacket } from "@/gemini";
import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

const FALLBACK_PACKET =
  "Decision packet unavailable. Please review the patient's intake notes directly before acting.";

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

  try {
    caseObj.packet = await generatePacket(caseObj);
  } catch (err) {
    console.error("Gemini packet error:", err);
    caseObj.packet = FALLBACK_PACKET;
  }

  res.status(200).json({ success: true, data: caseObj });
}
