"use client";

import React, { useEffect, useState } from "react";

type CaseTypeOption = "med-renewal" | "lab-followup" | "chronic-condition-check-in" | "general-enquiry";
type Step = "type" | "redflags" | "completeness" | "details" | "submitting" | "success";

const TYPE_OPTIONS: { value: CaseTypeOption; label: string; sub: string }[] = [
  { value: "med-renewal", label: "Medication renewal", sub: "Renew a current prescription" },
  { value: "lab-followup", label: "Lab result follow-up", sub: "Review recent lab or blood work" },
  { value: "chronic-condition-check-in", label: "Chronic care check-in", sub: "Routine monitoring of an ongoing condition" },
  { value: "general-enquiry", label: "General enquiry", sub: "A question or new symptom that doesn't fit the above" },
];

type GeneralSubtype = "physical" | "mental";

const GENERAL_SUBTYPES: { value: GeneralSubtype; label: string; sub: string }[] = [
  { value: "physical", label: "Physical health", sub: "A body symptom or physical concern" },
  { value: "mental", label: "Mental health", sub: "Emotional wellbeing, anxiety, mood, or stress" },
];

const RED_FLAG_QUESTIONS: Record<string, string[]> = {
  "med-renewal": [
    "New or worsening symptoms since your last refill?",
    "Side effects or a reaction you're worried about?",
    "Is this an emergency or do you feel unsafe right now?",
  ],
  "lab-followup": [
    "Were you told this result is urgent or abnormal?",
    "New or worsening symptoms related to this test?",
    "Is this an emergency or do you feel unsafe right now?",
  ],
  "chronic-condition-check-in": [
    "Are your symptoms significantly worse than usual?",
    "Have you had an unexpected flare-up or new complication?",
    "Is this an emergency or do you feel unsafe right now?",
  ],
  "general-enquiry:physical": [
    "Are you experiencing chest pain, severe pain, or difficulty breathing?",
    "Did your symptoms come on suddenly and feel serious?",
    "Is this an emergency or do you feel unsafe right now?",
  ],
  "general-enquiry:mental": [
    "Are you having thoughts of self-harm or suicide?",
    "Do you feel like you or someone else is in immediate danger?",
    "Is this an emergency or do you feel unsafe right now?",
  ],
};

const COMPLETENESS: Partial<Record<
  CaseTypeOption,
  { question: string; yesLabel: string; noLabel: string; missingValue: string }
>> = {
  "med-renewal": {
    question:
      "Some medications require additional documents. Do you have a photo of your current prescription and — if applicable — a blood pressure reading from the past 30 days or a photo of the affected area ready to upload?",
    yesLabel: "Yes, everything is ready",
    noLabel: "No, I still need to upload something",
    missingValue: "prescription photo or required documentation",
  },
  "lab-followup": {
    question: "Is the lab result uploaded to your account?",
    yesLabel: "Yes, it's uploaded",
    noLabel: "Not yet",
    missingValue: "lab result",
  },
  "chronic-condition-check-in": {
    question: "Do you have recent measurements to share? (blood pressure, glucose, A1c, weight, etc.)",
    yesLabel: "Yes, I have recent measurements",
    noLabel: "No, I don't have measurements right now",
    missingValue: "recent measurements",
  },
};

const LANE_MESSAGES: Record<string, { title: string; body: string }> = {
  "async-ready": {
    title: "Request received",
    body: "A care provider will review your request and respond shortly. No appointment needed.",
  },
  "async-pending": {
    title: "Request received — one more thing",
    body: "Your care team will follow up to collect the missing information before they can respond.",
  },
  "needs-sync": {
    title: "A provider will contact you",
    body: "Based on your answers, your request has been flagged for a live consultation. A care provider will reach out to schedule a visit.",
  },
};

const VISIBLE_STEPS: Step[] = ["type", "redflags", "completeness", "details"];
const STEP_LABELS: Record<Step, string> = {
  type: "Type",
  redflags: "Safety",
  completeness: "Readiness",
  details: "Details",
  submitting: "Details",
  success: "Done",
};

const DETAILS_CAP = 280;

interface FormState {
  caseType: CaseTypeOption | null;
  generalSubtype: GeneralSubtype | null;
  redFlagAnswers: (boolean | null)[];
  completenessAnswer: boolean | null;
  details: string;
}

const BLANK_STATE: FormState = {
  caseType: null,
  generalSubtype: null,
  redFlagAnswers: [null, null, null],
  completenessAnswer: null,
  details: "",
};

export default function PatientPage() {
  const [step, setStep] = useState<Step>("type");
  const [form, setForm] = useState<FormState>(BLANK_STATE);
  const [result, setResult] = useState<{ caseId: string | null; lane: string | null }>({
    caseId: null,
    lane: null,
  });

  useEffect(() => {
    fetch("/api/init_patient").catch(() => {});
  }, []);

  const hasCompleteness = form.caseType ? !!COMPLETENESS[form.caseType] : false;
  const anyRedFlag = form.redFlagAnswers.some((a) => a === true);
  const allRedFlagsAnswered = form.caseType
    ? form.redFlagAnswers.every((a) => a !== null)
    : false;

  // Key into RED_FLAG_QUESTIONS — general-enquiry needs a subtype suffix
  const redFlagKey =
    form.caseType === "general-enquiry" && form.generalSubtype
      ? `general-enquiry:${form.generalSubtype}`
      : (form.caseType ?? "");

  // Step 0 Continue is ready when type is selected, plus subtype when general-enquiry
  const typeStepReady =
    form.caseType !== null &&
    (form.caseType !== "general-enquiry" || form.generalSubtype !== null);

  function setRedFlag(index: number, value: boolean) {
    setForm((f) => {
      const next = [...f.redFlagAnswers] as (boolean | null)[];
      next[index] = value;
      return { ...f, redFlagAnswers: next };
    });
  }

  function afterRedflags() {
    if (hasCompleteness) setStep("completeness");
    else setStep("details");
  }

  function backFromDetails() {
    if (hasCompleteness) setStep("completeness");
    else setStep("redflags");
  }

  // Derive visible steps for the progress indicator (skip completeness if not applicable)
  const visibleSteps: Step[] = form.caseType
    ? hasCompleteness
      ? ["type", "redflags", "completeness", "details"]
      : ["type", "redflags", "details"]
    : VISIBLE_STEPS;

  async function submit() {
    if (!form.caseType) return;
    setStep("submitting");

    const completenessCheck = form.caseType ? COMPLETENESS[form.caseType] : null;
    const missing =
      completenessCheck && form.completenessAnswer === false
        ? completenessCheck.missingValue
        : "";

    const payload = {
      service: form.caseType,
      generalSubtype: form.generalSubtype ?? "",
      anyRedFlag: anyRedFlag ? "true" : "false",
      missing,
      details: form.details,
    };

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ caseId: json.data?.caseId ?? null, lane: json.data?.lane ?? null });
        setStep("success");
      } else {
        setStep("details");
      }
    } catch {
      setStep("details");
    }
  }

  const currentIndex = visibleSteps.indexOf(step === "submitting" ? "details" : step);
  const showProgress = step !== "success";

  return (
    <div className="patient-body">
      {showProgress && (
        <div className="patient-steps">
          {visibleSteps.map((s, i) => {
            const active = i === currentIndex;
            const done = i < currentIndex;
            return (
              <React.Fragment key={s}>
                {i > 0 && <div className="step-line" />}
                <div className={`step-dot ${active ? "active" : done ? "done" : ""}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`step-label ${active ? "active" : ""}`}>
                  {STEP_LABELS[s]}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="patient-card">
        {step === "type" && (
          <>
            <h2 className="patient-heading">What do you need support with today?</h2>
            <p className="patient-sub">
              We will determine if your case can be safely treated virtually, or
              if an in-person examination at a clinic or the ER is necessary.
            </p>
            <div className="service-grid">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`service-card ${form.caseType === opt.value ? "selected" : ""}`}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      caseType: opt.value,
                      generalSubtype: null,
                      redFlagAnswers: [null, null, null],
                      completenessAnswer: null,
                    }))
                  }
                >
                  <span className="service-label">{opt.label}</span>
                  <span className="service-sub">{opt.sub}</span>
                </button>
              ))}
            </div>

            {form.caseType === "general-enquiry" && (
              <>
                <p className="patient-sub" style={{ marginTop: 16, marginBottom: 8 }}>
                  Is this about physical or mental health?
                </p>
                <div className="service-grid">
                  {GENERAL_SUBTYPES.map((sub) => (
                    <button
                      key={sub.value}
                      type="button"
                      className={`service-card ${form.generalSubtype === sub.value ? "selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, generalSubtype: sub.value }))}
                    >
                      <span className="service-label">{sub.label}</span>
                      <span className="service-sub">{sub.sub}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="patient-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn-patient-next"
                disabled={!typeStepReady}
                onClick={() => setStep("redflags")}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {step === "redflags" && form.caseType && (
          <>
            <h2 className="patient-heading">Safety check</h2>
            <p className="patient-sub">Answer yes or no for each question.</p>
            <div className="flag-list">
              {(RED_FLAG_QUESTIONS[redFlagKey] ?? []).map((q, i) => (
                <div key={q} className="flag-row">
                  <span className="flag-q">{q}</span>
                  <div className="flag-yn">
                    <button
                      type="button"
                      className={`flag-btn yes ${form.redFlagAnswers[i] === true ? "active" : ""}`}
                      onClick={() => setRedFlag(i, true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`flag-btn no ${form.redFlagAnswers[i] === false ? "active" : ""}`}
                      onClick={() => setRedFlag(i, false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {anyRedFlag && (
              <div className="sync-note-patient">
                Based on your answers, a provider will reach out to schedule a live consultation.
              </div>
            )}
            <div className="patient-actions">
              <button
                type="button"
                className="btn-patient-back"
                onClick={() => setStep("type")}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-patient-next"
                disabled={!allRedFlagsAnswered}
                onClick={afterRedflags}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {step === "completeness" && form.caseType && COMPLETENESS[form.caseType] && (
          <>
            <h2 className="patient-heading">Quick check</h2>
            <p className="patient-sub">{COMPLETENESS[form.caseType]!.question}</p>
            <div className="yn-group">
              <button
                type="button"
                className={`yn-card ${form.completenessAnswer === true ? "selected" : ""}`}
                onClick={() => setForm((f) => ({ ...f, completenessAnswer: true }))}
              >
                {COMPLETENESS[form.caseType]!.yesLabel}
              </button>
              <button
                type="button"
                className={`yn-card ${form.completenessAnswer === false ? "selected" : ""}`}
                onClick={() => setForm((f) => ({ ...f, completenessAnswer: false }))}
              >
                {COMPLETENESS[form.caseType]!.noLabel}
              </button>
            </div>
            <div className="patient-actions">
              <button
                type="button"
                className="btn-patient-back"
                onClick={() => setStep("redflags")}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-patient-next"
                disabled={form.completenessAnswer === null}
                onClick={() => setStep("details")}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {(step === "details" || step === "submitting") && (
          <>
            <h2 className="patient-heading">Anything else for your provider?</h2>
            <p className="patient-sub">Optional — keep it brief.</p>
            <div style={{ position: "relative" }}>
              <textarea
                className="patient-textarea"
                rows={4}
                placeholder="Add any context that would help your provider…"
                maxLength={DETAILS_CAP}
                value={form.details}
                onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                disabled={step === "submitting"}
              />
              <span className="char-count">
                {form.details.length} / {DETAILS_CAP}
              </span>
            </div>
            <div className="patient-actions">
              <button
                type="button"
                className="btn-patient-back"
                onClick={backFromDetails}
                disabled={step === "submitting"}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-patient-next"
                onClick={submit}
                disabled={step === "submitting"}
              >
                {step === "submitting" ? "Submitting…" : "Submit →"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="success-panel">
            <div className="success-icon">✓</div>
            <h2 className="patient-heading">
              {LANE_MESSAGES[result.lane ?? "async-ready"]?.title}
            </h2>
            <p className="patient-sub">
              {LANE_MESSAGES[result.lane ?? "async-ready"]?.body}
            </p>
            {result.caseId && (
              <div className="success-meta">
                <span className="mono">Case {result.caseId.slice(0, 8)}</span>
              </div>
            )}
            <div className="patient-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn-patient-next"
                onClick={() => {
                  setForm(BLANK_STATE);
                  setResult({ caseId: null, lane: null });
                  setStep("type");
                }}
              >
                Submit another request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
