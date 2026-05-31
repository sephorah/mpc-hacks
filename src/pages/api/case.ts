import { getState } from "@/state";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
)
{
    const sync_cases = getState().queue.getAll("sync");
    const async_cases = getState().queue.getAll("async");

    res.status(200).json({
        success: true,
        data: {
            sync_cases,
            async_cases
        }
    });
}
