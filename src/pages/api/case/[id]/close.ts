import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    
    if (req.method !== "POST") {
        res.status(405).json({ success: false, message: "Method not allowed" });
        return;
    }
    
    const { id } = req.query;
    const item = getState().queue.get(String(id));

    if (!item) {
        res.status(404).json({ success: false, message: "Case not found" });
        return;
    }

    const caseObj = item.caseObj;

    // Async case closed; send attestation response to user
    if (caseObj.lane == 'async-ready') {
        const attestation = req.body.attestation;
    }

    res.status(200).json({ success: true, data: caseObj });
}