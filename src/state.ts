import { randomUUID } from "node:crypto";

declare global {
  var _state: State | undefined;
}

export function getState(): State {
  if (!global._state) {
    global._state = new State();
    global._state.seedDemoData();
  }
  return global._state;
}

// ─── Enums ──────────────────────────────────────────────────────────────────────

export enum MedicalServiceType {
  RENEWAL = "RENEWAL",
  LAB_FOLLOW_UP = "LAB_FOLLOW_UP",
  CHRONIC_CHECK_IN = "CHRONIC_CHECK_IN",
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

// ─── State Engine ───────────────────────────────────────────────────────────────

export class State {
  private cases = new Map<string, PatientCase>();
  private cohorts = new Map<string, CohortGroup>();
  private threads = new Map<string, ThreadMessage[]>();

  // ── Layer 1: Red-Flag Validation ──────────────────────────────────────────

  validateLayer1(payload: IngestPayload): string[] {
    const flags: string[] = [];
    for (const key of RED_FLAG_KEYS) {
      if (payload.redFlagChecks[key]) flags.push(key);
    }
    if (
      payload.vitals.systolicBP != null &&
      payload.vitals.systolicBP > BP_THRESHOLDS.systolicMax
    ) {
      flags.push("highSystolicBP");
    }
    if (
      payload.vitals.diastolicBP != null &&
      payload.vitals.diastolicBP > BP_THRESHOLDS.diastolicMax
    ) {
      flags.push("highDiastolicBP");
    }
    return flags;
  }

  // ── Layer 2: Outlier Detection Within Cohort ──────────────────────────────

  private detectOutliers(
    patientCase: PatientCase,
    cohort: CohortGroup,
  ): string[] {
    const flags: string[] = [];

    // Dosage change request on a renewal is always an outlier
    if (
      patientCase.serviceType === MedicalServiceType.RENEWAL &&
      patientCase.structuredData.requestingDosageChange === true
    ) {
      flags.push("dosageChangeRequested");
    }

    // Compare structured fields against the first existing case in cohort
    const otherCases = cohort.caseIds
      .filter((id) => id !== patientCase.id)
      .map((id) => this.cases.get(id))
      .filter(Boolean) as PatientCase[];

    if (otherCases.length > 0) {
      const ref = otherCases[0];
      for (const field of ["currentDosage", "frequency", "labType"]) {
        if (
          patientCase.structuredData[field] !== undefined &&
          ref.structuredData[field] !== undefined &&
          patientCase.structuredData[field] !== ref.structuredData[field]
        ) {
          flags.push(`deviation:${field}`);
        }
      }
    }

    return flags;
  }

  // ── Submit Case ───────────────────────────────────────────────────────────

  submitCase(payload: IngestPayload): PatientCase {
    const id = randomUUID();
    const redFlags = this.validateLayer1(payload);
    const isEscalated = redFlags.length > 0;

    const c: PatientCase = {
      id,
      patientName: payload.patientName,
      serviceType: payload.serviceType,
      conditionKey: payload.conditionKey,
      structuredData: payload.structuredData,
      freeText: payload.freeText,
      freeTextSummary: "",
      safetyFlags: [...redFlags],
      status: isEscalated
        ? CaseStatus.ESC_SYNCHRONOUS
        : CaseStatus.INTAKE_PENDING,
      cohortId: null,
      createdAt: Date.now(),
      resolvedAt: null,
      attestedBy: null,
      attestedAt: null,
      attestationNotes: "",
      escalationReason: isEscalated
        ? `Red flags triggered: ${redFlags.join(", ")}`
        : "",
    };

    this.cases.set(id, c);
    this.threads.set(id, []);

    if (isEscalated) {
      this.pushMessage(
        id,
        "alert",
        `Case escalated to synchronous care — flags: ${redFlags.join(", ")}.`,
      );
    } else {
      this.pushMessage(
        id,
        "system",
        "Case submitted successfully. Entering asynchronous review queue.",
      );
      this.clusterIntoCohort(c);
    }

    return c;
  }

  // ── Cohort Clustering ─────────────────────────────────────────────────────

  private clusterIntoCohort(c: PatientCase): void {
    const key = `${c.serviceType}::${c.conditionKey}`;

    let cohort = this.cohorts.get(key);
    if (!cohort) {
      cohort = {
        id: key,
        serviceType: c.serviceType,
        conditionKey: c.conditionKey,
        caseIds: [],
        createdAt: Date.now(),
      };
      this.cohorts.set(key, cohort);
    }

    cohort.caseIds.push(c.id);
    c.cohortId = key;

    // Layer 2 scan
    const outlierFlags = this.detectOutliers(c, cohort);
    if (outlierFlags.length > 0) {
      c.safetyFlags.push(...outlierFlags);
      c.status = CaseStatus.OUTLIER_ISOLATED;
      cohort.caseIds = cohort.caseIds.filter((id) => id !== c.id);
      c.cohortId = null;
      this.pushMessage(
        c.id,
        "alert",
        `Flagged for individual review — ${outlierFlags.join(", ")}.`,
      );
    } else {
      c.status = CaseStatus.COHORT_READY;
      this.pushMessage(
        c.id,
        "system",
        `Added to cohort: ${c.conditionKey} (${c.serviceType.toLowerCase().replace(/_/g, " ")}).`,
      );
    }
  }

  // ── Attestation ───────────────────────────────────────────────────────────

  attestCase(
    caseId: string,
    doctorId: string,
    notes: string,
  ): PatientCase | null {
    const c = this.cases.get(caseId);
    if (!c) return null;

    c.status = CaseStatus.RESOLVED;
    c.attestedBy = doctorId;
    c.attestedAt = Date.now();
    c.attestationNotes = notes;
    c.resolvedAt = Date.now();

    // Remove from cohort
    if (c.cohortId) {
      const cohort = this.cohorts.get(c.cohortId);
      if (cohort)
        cohort.caseIds = cohort.caseIds.filter((id) => id !== caseId);
    }

    this.pushMessage(
      caseId,
      "resolution",
      `Resolved by Dr. ${doctorId}.${notes ? ` Notes: ${notes}` : ""}`,
    );
    return c;
  }

  attestCohort(
    cohortId: string,
    doctorId: string,
    attestations: { caseId: string; notes: string }[],
  ): PatientCase[] {
    return attestations
      .map((a) => this.attestCase(a.caseId, doctorId, a.notes))
      .filter(Boolean) as PatientCase[];
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalateCase(caseId: string, reason: string): PatientCase | null {
    const c = this.cases.get(caseId);
    if (!c) return null;

    if (c.cohortId) {
      const cohort = this.cohorts.get(c.cohortId);
      if (cohort)
        cohort.caseIds = cohort.caseIds.filter((id) => id !== caseId);
      c.cohortId = null;
    }

    c.status = CaseStatus.ESC_SYNCHRONOUS;
    c.escalationReason = reason;
    this.pushMessage(
      caseId,
      "alert",
      `Escalated to synchronous care — ${reason}.`,
    );
    return c;
  }

  // ── AI Summary Update ─────────────────────────────────────────────────────

  updateSummary(caseId: string, summary: string): void {
    const c = this.cases.get(caseId);
    if (c) c.freeTextSummary = summary;
  }

  // ── Thread Messages ───────────────────────────────────────────────────────

  private pushMessage(
    caseId: string,
    type: ThreadMessage["type"],
    content: string,
  ): void {
    const thread = this.threads.get(caseId) ?? [];
    thread.push({
      id: randomUUID(),
      caseId,
      type,
      content,
      timestamp: Date.now(),
    });
    this.threads.set(caseId, thread);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  getCase(id: string): PatientCase | undefined {
    return this.cases.get(id);
  }

  getAllCases(): PatientCase[] {
    return [...this.cases.values()];
  }

  getCasesByStatus(status: CaseStatus): PatientCase[] {
    return this.getAllCases().filter((c) => c.status === status);
  }

  getCohort(id: string): CohortGroup | undefined {
    return this.cohorts.get(id);
  }

  getAllCohorts(): CohortGroup[] {
    return [...this.cohorts.values()];
  }

  getCohortWithCases(
    cohortId: string,
  ): (CohortGroup & { cases: PatientCase[] }) | null {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return null;
    return {
      ...cohort,
      cases: cohort.caseIds
        .map((id) => this.cases.get(id))
        .filter(Boolean) as PatientCase[],
    };
  }

  getThread(caseId: string): ThreadMessage[] {
    return this.threads.get(caseId) ?? [];
  }

  getStats(): ProviderStats {
    const all = this.getAllCases();
    const today = new Date().toDateString();
    return {
      totalPending: all.filter(
        (c) =>
          c.status === CaseStatus.INTAKE_PENDING ||
          c.status === CaseStatus.COHORT_READY,
      ).length,
      activeCohorts: this.getAllCohorts().filter((c) => c.caseIds.length > 0)
        .length,
      outlierCases: all.filter((c) => c.status === CaseStatus.OUTLIER_ISOLATED)
        .length,
      escalatedCases: all.filter((c) => c.status === CaseStatus.ESC_SYNCHRONOUS)
        .length,
      resolvedToday: all.filter(
        (c) =>
          c.status === CaseStatus.RESOLVED &&
          c.resolvedAt != null &&
          new Date(c.resolvedAt).toDateString() === today,
      ).length,
    };
  }

  // ── Seed Demo Data ────────────────────────────────────────────────────────

  seedDemoData(): void {
    const ago = (minutes: number) => Date.now() - minutes * 60_000;

    const synthroidCases = [
      { name: "Marie Tremblay", text: "Feeling fine, no issues with current dose." },
      { name: "Jean-Pierre Bouchard", text: "All stable, same prescription please." },
      { name: "Sophie Lalonde", text: "No side effects, thyroid levels good last check." },
      { name: "Luc Gagnon", text: "Everything normal, just need my refill." },
    ];

    for (const [i, p] of synthroidCases.entries()) {
      const c = this.submitCase({
        patientName: p.name,
        serviceType: MedicalServiceType.RENEWAL,
        conditionKey: "Synthroid",
        structuredData: {
          medicationName: "Synthroid",
          currentDosage: "50mcg",
          frequency: "Once daily",
          requestingDosageChange: false,
        },
        freeText: p.text,
        redFlagChecks: {},
        vitals: {
          systolicBP: 118 + i * 3,
          diastolicBP: 75 + i * 2,
          heartRate: 68 + i,
        },
      });
      c.createdAt = ago(45 - i * 5);
      c.freeTextSummary = `Stable on current dose, no concerns reported.`;
    }

    // Synthroid outlier — dosage change requested
    const outlier = this.submitCase({
      patientName: "Isabelle Côté",
      serviceType: MedicalServiceType.RENEWAL,
      conditionKey: "Synthroid",
      structuredData: {
        medicationName: "Synthroid",
        currentDosage: "50mcg",
        newDosage: "75mcg",
        frequency: "Once daily",
        requestingDosageChange: true,
      },
      freeText:
        "My doctor mentioned at my last appointment that I might need to increase my dose since my TSH is still a bit high.",
      redFlagChecks: {},
      vitals: { systolicBP: 122, diastolicBP: 78, heartRate: 72 },
    });
    outlier.createdAt = ago(38);
    outlier.freeTextSummary =
      "Requesting dose increase from 50mcg to 75mcg due to elevated TSH.";

    // Metformin cohort
    const metforminCases = [
      { name: "Marc Bélanger", text: "Blood sugar has been well controlled." },
      { name: "Nathalie Fortin", text: "Stable, no GI issues anymore." },
      { name: "Robert Pelletier", text: "A1C was 6.8 last month, doing well." },
    ];

    for (const [i, p] of metforminCases.entries()) {
      const c = this.submitCase({
        patientName: p.name,
        serviceType: MedicalServiceType.RENEWAL,
        conditionKey: "Metformin",
        structuredData: {
          medicationName: "Metformin",
          currentDosage: "500mg",
          frequency: "Twice daily",
          requestingDosageChange: false,
        },
        freeText: p.text,
        redFlagChecks: {},
        vitals: {
          systolicBP: 125 + i * 2,
          diastolicBP: 80 + i,
          heartRate: 74 + i,
        },
      });
      c.createdAt = ago(30 - i * 4);
      c.freeTextSummary = "Diabetes well controlled, standard renewal.";
    }

    // Lisinopril cohort
    const lisinoprilCases = [
      { name: "Claire Bergeron", text: "BP has been good, no dizziness." },
      { name: "Philippe Rousseau", text: "Stable on current dose, no cough." },
    ];

    for (const [i, p] of lisinoprilCases.entries()) {
      const c = this.submitCase({
        patientName: p.name,
        serviceType: MedicalServiceType.RENEWAL,
        conditionKey: "Lisinopril",
        structuredData: {
          medicationName: "Lisinopril",
          currentDosage: "10mg",
          frequency: "Once daily",
          requestingDosageChange: false,
        },
        freeText: p.text,
        redFlagChecks: {},
        vitals: {
          systolicBP: 132 + i * 4,
          diastolicBP: 82 + i * 2,
          heartRate: 70 + i,
        },
      });
      c.createdAt = ago(25 - i * 6);
      c.freeTextSummary = "Blood pressure well managed, routine renewal.";
    }

    // Lab follow-up cohort — CBC
    const cbcCases = [
      { name: "Émilie Chen", text: "Had bloodwork done last Tuesday, results should be in." },
      { name: "David Park", text: "Following up on routine CBC panel." },
    ];

    for (const [i, p] of cbcCases.entries()) {
      const c = this.submitCase({
        patientName: p.name,
        serviceType: MedicalServiceType.LAB_FOLLOW_UP,
        conditionKey: "CBC",
        structuredData: {
          labType: "CBC",
          testDate: "2026-05-25",
          resultsAvailable: true,
        },
        freeText: p.text,
        redFlagChecks: {},
        vitals: {
          systolicBP: 115 + i * 5,
          diastolicBP: 72 + i * 3,
          heartRate: 66 + i * 2,
        },
      });
      c.createdAt = ago(20 - i * 3);
      c.freeTextSummary = "Routine CBC follow-up, results available.";
    }

    // TSH lab follow-up
    const tshCase = this.submitCase({
      patientName: "Fatima Hassan",
      serviceType: MedicalServiceType.LAB_FOLLOW_UP,
      conditionKey: "TSH",
      structuredData: {
        labType: "TSH",
        testDate: "2026-05-22",
        resultsAvailable: true,
      },
      freeText: "Getting thyroid levels checked as requested by my doctor.",
      redFlagChecks: {},
      vitals: { systolicBP: 118, diastolicBP: 74, heartRate: 70 },
    });
    tshCase.createdAt = ago(15);
    tshCase.freeTextSummary = "TSH follow-up, results pending review.";

    // Escalated case — chest pain
    const escalated = this.submitCase({
      patientName: "Thomas Martin",
      serviceType: MedicalServiceType.RENEWAL,
      conditionKey: "Atorvastatin",
      structuredData: {
        medicationName: "Atorvastatin",
        currentDosage: "20mg",
        frequency: "Once daily",
        requestingDosageChange: false,
      },
      freeText:
        "I've been having some chest tightness when climbing stairs. Also need my statin refill.",
      redFlagChecks: { chestPain: true },
      vitals: { systolicBP: 155, diastolicBP: 95, heartRate: 88 },
    });
    escalated.createdAt = ago(10);
    escalated.freeTextSummary =
      "Reports chest tightness with exertion, requesting statin renewal.";

    // One resolved case for demo
    const resolvedPayload: IngestPayload = {
      patientName: "Anh Nguyen",
      serviceType: MedicalServiceType.RENEWAL,
      conditionKey: "Metformin",
      structuredData: {
        medicationName: "Metformin",
        currentDosage: "500mg",
        frequency: "Twice daily",
        requestingDosageChange: false,
      },
      freeText: "Everything stable with diabetes management.",
      redFlagChecks: {},
      vitals: { systolicBP: 120, diastolicBP: 76, heartRate: 72 },
    };
    const resolved = this.submitCase(resolvedPayload);
    resolved.createdAt = ago(120);
    resolved.freeTextSummary = "Stable diabetes management, routine renewal.";
    this.attestCase(resolved.id, "Dr. Lavoie", "Approved — standard renewal.");
  }
}