import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cases = [...getState().cases.values()].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  res.status(200).json({ success: true, data: cases });
}
