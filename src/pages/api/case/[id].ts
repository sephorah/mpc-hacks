import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const { id } = req.query;

    const caseObj = getState().queue.get(String(id));

    if (!caseObj) {
        res.status(404).json({ success: false, message: "Case not found" });
        return;
    }

    res.status(200).json({ success: true, data: caseObj });
}