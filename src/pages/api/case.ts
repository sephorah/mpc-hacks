import { queue } from "@/queue";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
)
{
    const sync_cases = queue.getAll("sync");
    const async_cases = queue.getAll("async");

    res.status(200).json({
        success: true,
        data: {
            sync_cases,
            async_cases
        }
    });
}
