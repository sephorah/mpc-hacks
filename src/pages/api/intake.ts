import type { NextApiRequest, NextApiResponse } from "next";
import { getPatientFromReq } from "../../state";
import { Case } from "../../types"
import { randomUUID } from "crypto";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

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

  // TODO: Validate form data
  // TODO: Process form data
  // TODO: Create and store/persist case to db

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: 
`Format the given patient intake request into the following JSON format. You should only output JSON.\n
{
    
}
`
  });

  // Create case and return its id
//   const newCase: Case = {
//     id: randomUUID(),

//   };

  return res.status(200).json({
    success: true,
    message: "Form submitted successfully, case created",
    data: { patientId: patient.id },
  });
}
