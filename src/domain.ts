// ─── Enums ──────────────────────────────────────────────────────────────────────

export enum MedicalServiceType {
  RENEWAL = "RENEWAL",
  LAB_FOLLOW_UP = "LAB_FOLLOW_UP",
  CHRONIC_CHECK_IN = "CHRONIC_CHECK_IN",
  DIRECT_CONTACT = "DIRECT_CONTACT",
}

export enum CaseStatus {
  INTAKE_PENDING = "INTAKE_PENDING",
  COHORT_READY = "COHORT_READY",
  OUTLIER_ISOLATED = "OUTLIER_ISOLATED",
  RESOLVED = "RESOLVED",
  ESC_SYNCHRONOUS = "ESC_SYNCHRONOUS",
}

// ─── Constants ──────────────────────────────────────────────────────────────────

export const RED_FLAG_KEYS = [
  "shortnessOfBreath",
  "chestPain",
  "suddenVisionChanges",
  "severeHeadache",
  "suicidalThoughts",
  "seizureOrFainting",
] as const;

export const RED_FLAG_LABELS: Record<string, string> = {
  shortnessOfBreath: "Shortness of Breath",
  chestPain: "Chest Pain",
  suddenVisionChanges: "Sudden Vision Changes",
  severeHeadache: "Severe Headache",
  suicidalThoughts: "Suicidal Thoughts",
  seizureOrFainting: "Seizure or Fainting",
  highSystolicBP: "Systolic BP > 180",
  highDiastolicBP: "Diastolic BP > 120",
};

export const BP_THRESHOLDS = { systolicMax: 180, diastolicMax: 120 } as const;

// ─── Interfaces ─────────────────────────────────────────────────────────────────

export interface Vitals {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
}

export interface IngestPayload {
  patientName: string;
  serviceType: MedicalServiceType;
  conditionKey: string;
  structuredData: Record<string, unknown>;
  freeText: string;
  redFlagChecks: Record<string, boolean>;
  vitals: Vitals;
}

export interface PatientCase {
  id: string;
  patientName: string;
  serviceType: MedicalServiceType;
  conditionKey: string;
  structuredData: Record<string, unknown>;
  freeText: string;
  freeTextSummary: string;
  safetyFlags: string[];
  status: CaseStatus;
  cohortId: string | null;
  createdAt: number;
  resolvedAt: number | null;
  attestedBy: string | null;
  attestedAt: number | null;
  attestationNotes: string;
  escalationReason: string;
}

export interface CohortGroup {
  id: string;
  serviceType: MedicalServiceType;
  conditionKey: string;
  caseIds: string[];
  createdAt: number;
}

export interface ThreadMessage {
  id: string;
  caseId: string;
  type: "system" | "alert" | "resolution";
  content: string;
  timestamp: number;
}

export interface ProviderStats {
  totalPending: number;
  activeCohorts: number;
  outlierCases: number;
  escalatedCases: number;
  resolvedToday: number;
}
