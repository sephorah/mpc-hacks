import type { NextApiRequest, NextApiResponse } from "next";
import { getPatientFromReq, getState } from "../../state";
import { type QueueCategory } from "../../queue";
import type { Case, CaseType, Lane } from "../../types";

interface IntakeFormData {
  service?: string;      // "med-renewal" | "lab-followup"
  anyRedFlag?: string;   // "true" | "false"  — explicit from structured form
  missing?: string;      // set by completeness check, empty string = nothing missing
  details?: string;      // optional free text
  // Legacy single-field fallback
  whatswrong?: string;
  [key: string]: string | undefined;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// Keyword fallback — only used when anyRedFlag is not provided (legacy path)
const RED_FLAG_KEYWORDS = [
  "chest pain", "chest tightness", "shortness of breath", "can't breathe",
  "heart attack", "stroke", "severe", "emergency", "crushing", "fainting",
  "unconscious", "bleeding heavily", "suicidal", "self-harm",
];

function classify(formData: IntakeFormData, patientId: string): Case {
  const freeText = formData.details ?? formData.whatswrong ?? "";
  const text = freeText.toLowerCase();

  // --- Type ---
  let type: CaseType = "general-enquiry";
  if (formData.service === "med-renewal") type = "med-renewal";
  else if (formData.service === "lab-followup") type = "lab-followup";

  // --- Red flags ---
  // Structured form sends anyRedFlag explicitly; legacy path scans free text.
  const redFlags =
    formData.anyRedFlag !== undefined
      ? formData.anyRedFlag === "true"
      : RED_FLAG_KEYWORDS.some((kw) => text.includes(kw));

  // --- Missing info ---
  // Structured form sends missing directly (empty string = nothing missing).
  const missing: string | null =
    formData.anyRedFlag !== undefined
      ? formData.missing || null
      : null;

  // --- Lane ---
  let lane: Lane;
  if (redFlags) lane = "needs-sync";
  else if (missing) lane = "async-pending";
  else lane = "async-ready";

  return {
    patient_id: patientId,
    id: crypto.randomUUID(),
    type,
    lane,
    answers: {},
    redFlags,
    missing,
    freeText,
    packet: null,
    status: "open",
    cohortId: type !== "general-enquiry" && lane !== "needs-sync" ? `cohort-${type}:${lane}` : null,
    createdAt: Date.now(),
    closedAt: null,
    escalatedAt: null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const patient = getPatientFromReq(req);
  if (!patient) {
    return res.status(401).json({ success: false, message: "Patient not found" });
  }

  const caseObj = classify(req.body as IntakeFormData, patient.id);
  const queueCategory: QueueCategory = caseObj.lane === "needs-sync" ? "sync" : "async";

  getState().cases.set(caseObj.id, caseObj);
  getState().queue.enqueue(caseObj, queueCategory);

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
}
