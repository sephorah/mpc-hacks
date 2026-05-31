export type CaseType =
  | "med-renewal"
  | "lab-followup"
  | "chronic-condition-check-in"
  | "general-enquiry";

export const PossibleCaseTypes = [
  "med-renewal",
  "lab-followup",
  "chronic-condition-check-in",
  "general-enquiry",
] as const;

export type Lane =
  | "needs-sync"
  | "async-pending"
  | "async-ready";

export type Case = {
  patient_id: string | null;
  id: string;
  type: CaseType;
  lane: Lane;
  answers: Record<string, boolean>;
  redFlags: boolean;
  missing: string | null;
  freeText: string;
  packet: string | null;
  status: "open" | "closed" | "escalated";
  cohortId: string | null;
  createdAt: number;
  closedAt: number | null;
  escalatedAt: number | null;
};

export type Patient = {
  id: string;
  createdAt: string;
};
