import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (caseObj.lane === "needs-sync") {
    res
      .status(400)
      .json({ success: false, message: "needs-sync cases cannot close async" });
    return;
  }

  caseObj.status = "closed";
  caseObj.closedAt = Date.now();

  res.status(200).json({ success: true, data: caseObj });
}
