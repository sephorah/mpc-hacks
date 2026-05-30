import type { NextApiRequest, NextApiResponse } from "next";
import { getPatientFromReq } from "../../state";
import { convertFormToCase } from "../../gemini";
import { queue, type QueueCategory } from "../../queue";

interface IntakeFormData {
  // TODO: Define form fields as they're added
  [key: string]: unknown;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const patient = getPatientFromReq(req);
  if (!patient) {
    return res.status(401).json({ success: false, message: "Patient not found" });
  }

  const formData: IntakeFormData = req.body;

  try {
    // Convert form data to structured case object using Gemini
    const caseObj = await convertFormToCase(formData, patient.id);

    // Missing info, send back to user
    if (caseObj.lane == 'async-pending') {
        res.status(400).json(
            {
                success: false,
                message: "Async case is missing required information. Please revise and try again",
                data: {
                    missing: caseObj.missing
                }
            }
        );
        return;
    }

    // Determine queue category based on case lane
    const queueCategory: QueueCategory = caseObj.lane === "needs-sync" ? "sync" : "async";

    // Enqueue the case
    queue.enqueue(caseObj, queueCategory);

    return res.status(200).json({
      success: true,
      message: "Form submitted successfully",
      data: {
        patientId: patient.id,
        caseId: caseObj.id,
        lane: caseObj.lane,
        queue: queueCategory,
      },
    });
  } catch (error) {
    console.error("Error processing intake form:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing form submission",
    });
  }
}
