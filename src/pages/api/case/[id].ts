import type { NextApiRequest, NextApiResponse } from "next";
import { queue } from "@/queue";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

    const { id: string } = req.query;

    const caseObj = queue.get(id);

    if (!caseObj) {
        res.status(404).json({ success: false, message: "Case not found" });
        return;
    }

    res.status(200).json({ success: true, data: caseObj });

}