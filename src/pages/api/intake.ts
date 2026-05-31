import type { NextApiRequest, NextApiResponse } from "next";
import { getPatientFromReq, getState } from "../../state";
import { type QueueCategory } from "../../queue";
import type { Case, CaseType, Lane } from "../../types";

interface IntakeFormData extends Record<string, string> {
  whatswrong: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const RED_FLAG_KEYWORDS = [
  "chest pain", "chest tightness", "shortness of breath", "can't breathe",
  "heart attack", "stroke", "severe", "emergency", "crushing", "fainting",
  "unconscious", "bleeding heavily", "suicidal", "self-harm",
];

const RENEWAL_KEYWORDS = ["renew", "renewal", "refill", "prescription", "medication", "inhaler", "statin", "pill"];
const LAB_KEYWORDS = ["lab", "blood test", "blood work", "results", "bloodwork", "test results", "lab report"];
const CHRONIC_KEYWORDS = ["check-in", "checkup", "check up", "chronic", "follow-up", "followup", "monitoring"];

// lab-followup: result is already uploaded / in hand
const LAB_PRESENT_KEYWORDS = ["attached", "uploaded", "results are in", "results show", "i have my results", "you can see", "already in"];
// med-renewal: pharmacy info is missing
const PHARMACY_MISSING_KEYWORDS = ["new pharmacy", "changed pharmacy", "pharmacy changed", "different pharmacy", "don't have a pharmacy", "no pharmacy"];
// chronic check-in: patient has recent measurements to share
const MEASUREMENTS_PRESENT_KEYWORDS = ["my reading", "my readings", "blood pressure is", "bp is", "glucose is", "sugar is", "a1c is", "measured", "tracking"];

function ruleBasedClassify(formData: IntakeFormData, patientId: string): Case {
  const text = (formData.whatswrong ?? "").toLowerCase();

  const redFlags = RED_FLAG_KEYWORDS.some((kw) => text.includes(kw));

  let type: CaseType = "general-enquiry";
  if (RENEWAL_KEYWORDS.some((kw) => text.includes(kw))) type = "med-renewal";
  else if (LAB_KEYWORDS.some((kw) => text.includes(kw))) type = "lab-followup";
  else if (CHRONIC_KEYWORDS.some((kw) => text.includes(kw))) type = "chronic-condition-check-in";

  let lane: Lane;
  let missing: string | null = null;

  if (redFlags) {
    lane = "needs-sync";
  } else if (type === "lab-followup" && !LAB_PRESENT_KEYWORDS.some((kw) => text.includes(kw))) {
    lane = "async-pending";
    missing = "lab result";
  } else if (type === "med-renewal" && PHARMACY_MISSING_KEYWORDS.some((kw) => text.includes(kw))) {
    lane = "async-pending";
    missing = "pharmacy information";
  } else if (type === "chronic-condition-check-in" && !MEASUREMENTS_PRESENT_KEYWORDS.some((kw) => text.includes(kw))) {
    lane = "async-pending";
    missing = "recent measurements";
  } else {
    lane = "async-ready";
  }

  return {
    patient_id: patientId,
    id: crypto.randomUUID(),
    type,
    lane,
    answers: {},
    redFlags,
    missing,
    freeText: formData.whatswrong,
    packet: null,
    status: "open",
    cohortId: null,
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

  const formData: IntakeFormData = req.body;

  const caseObj = ruleBasedClassify(formData, patient.id);

  // async-pending means Gemini wants more info — keep it in the queue for now
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
