"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/app/_components/GlassCard";
import { ProgressStepper } from "@/app/_components/ProgressStepper";
import { MedicalServiceType } from "@/state";
import type { IngestPayload } from "@/state";

const MEDS = ["Synthroid", "Metformin", "Lisinopril", "Atorvastatin", "Amlodipine"];
const LABS = ["CBC", "TSH", "Lipid Panel", "A1C", "Liver Panel"];

export default function IntakePage() {
  const router = useRouter();
  const [service, setService] = useState<string>("");
  const [step, setStep] = useState(0);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [conditionKey, setConditionKey] = useState("");
  const [currentDosage, setCurrentDosage] = useState("");
  const [requestingDosageChange, setRequestingDosageChange] = useState(false);
  const [newDosage, setNewDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  
  const [testDate, setTestDate] = useState("");
  const [resultsAvailable, setResultsAvailable] = useState(false);

  // Vitals & Health
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(70);

  const [redFlags, setRedFlags] = useState<Record<string, boolean>>({
    shortnessOfBreath: false,
    chestPain: false,
    suddenVisionChanges: false,
    severeHeadache: false,
    suicidalThoughts: false,
    seizureOrFainting: false,
  });

  const [freeText, setFreeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emergency Modal
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setService(params.get("service") ?? "RENEWAL");
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const hasRedFlag = Object.values(redFlags).some((v) => v);
      if (hasRedFlag || systolic > 180 || diastolic > 120) {
        setShowEmergency(true);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const submitEscalated = async () => {
    setIsSubmitting(true);
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: IngestPayload = {
        patientName,
        serviceType: MedicalServiceType[service as keyof typeof MedicalServiceType],
        conditionKey,
        structuredData: service === "RENEWAL" ? {
          medicationName: conditionKey,
          currentDosage,
          frequency,
          requestingDosageChange,
          ...(requestingDosageChange ? { newDosage } : {})
        } : {
          labType: conditionKey,
          testDate,
          resultsAvailable
        },
        freeText,
        redFlagChecks: redFlags,
        vitals: {
          systolicBP: systolic,
          diastolicBP: diastolic,
          heartRate
        }
      };

      const res = await fetch("/api/submit-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (data.success) {
        // Trigger AI summary asynchronously
        fetch("/api/process-case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId: data.case.id }),
        }).catch(console.error);

        if (data.escalated) {
          router.push(`/patient/escalated?id=${data.case.id}`);
        } else {
          router.push(`/patient/thread/${data.case.id}`);
        }
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 relative">
      <div className="mb-8">
        <ProgressStepper steps={["Service Details", "Health Check", "Context", "Review"]} currentStep={step} />
      </div>

      <div className="relative">
        {step === 0 && (
          <GlassCard className="animate-slide-up">
            <h2 className="text-xl font-bold mb-6">Service Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient Name</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:border-primary focus:outline-none" placeholder="Jane Doe" />
              </div>

              {service === "RENEWAL" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Medication</label>
                    <select value={conditionKey} onChange={e => setConditionKey(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:border-primary focus:outline-none">
                      <option value="">Select medication...</option>
                      {MEDS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Dosage</label>
                      <input type="text" value={currentDosage} onChange={e => setCurrentDosage(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:outline-none" placeholder="e.g. 50mcg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Frequency</label>
                      <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:outline-none" placeholder="e.g. Once daily" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" checked={requestingDosageChange} onChange={e => setRequestingDosageChange(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4 bg-surface-alt border-white/[0.1]" />
                    <span className="text-sm">I am requesting a dosage change</span>
                  </label>
                  {requestingDosageChange && (
                    <div className="mt-2 animate-fade-in">
                      <label className="block text-sm font-medium mb-1">Requested New Dosage</label>
                      <input type="text" value={newDosage} onChange={e => setNewDosage(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:outline-none" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lab Type</label>
                    <select value={conditionKey} onChange={e => setConditionKey(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:outline-none">
                      <option value="">Select test...</option>
                      {LABS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Test Date</label>
                    <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} className="w-full bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-2 focus:outline-none [color-scheme:dark]" />
                  </div>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" checked={resultsAvailable} onChange={e => setResultsAvailable(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4 bg-surface-alt border-white/[0.1]" />
                    <span className="text-sm">My results are available in the portal</span>
                  </label>
                </>
              )}
            </div>
          </GlassCard>
        )}

        {step === 1 && (
          <GlassCard className="animate-slide-up">
            <h2 className="text-xl font-bold mb-6">Health Check</h2>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Vitals</h3>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm">Systolic BP</label>
                    <span className="font-mono text-primary">{systolic} mmHg</span>
                  </div>
                  <input type="range" min="80" max="220" value={systolic} onChange={e => setSystolic(parseInt(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm">Diastolic BP</label>
                    <span className="font-mono text-primary">{diastolic} mmHg</span>
                  </div>
                  <input type="range" min="40" max="140" value={diastolic} onChange={e => setDiastolic(parseInt(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm">Heart Rate</label>
                    <span className="font-mono text-primary">{heartRate} bpm</span>
                  </div>
                  <input type="range" min="40" max="180" value={heartRate} onChange={e => setHeartRate(parseInt(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>

              <hr className="border-white/[0.05]" />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Are you experiencing any of the following?</h3>
                {[
                  ["shortnessOfBreath", "Shortness of Breath"],
                  ["chestPain", "Chest Pain or Pressure"],
                  ["suddenVisionChanges", "Sudden Vision Changes"],
                  ["severeHeadache", "Severe or Unusual Headache"],
                  ["suicidalThoughts", "Thoughts of Self-Harm"],
                  ["seizureOrFainting", "Seizures or Fainting"]
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.05] hover:bg-surface-alt transition-colors cursor-pointer">
                    <input type="checkbox" checked={redFlags[key as string]} onChange={e => setRedFlags({...redFlags, [key as string]: e.target.checked})} className="h-5 w-5 rounded text-danger focus:ring-danger bg-surface border-white/[0.1]" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard className="animate-slide-up">
            <h2 className="text-xl font-bold mb-2">Additional Context</h2>
            <p className="text-sm text-text-muted mb-6">Please describe any additional symptoms, concerns, or context for the care team.</p>
            <div className="relative">
              <textarea 
                value={freeText} 
                onChange={e => setFreeText(e.target.value)} 
                maxLength={500}
                className="w-full h-40 bg-surface-alt border border-white/[0.1] rounded-lg px-4 py-3 focus:border-primary focus:outline-none resize-none"
                placeholder="E.g. I've been feeling slightly more fatigued than usual..."
              />
              <span className="absolute bottom-3 right-3 text-xs text-text-muted">{freeText.length}/500</span>
            </div>
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard className="animate-slide-up">
            <h2 className="text-xl font-bold mb-6">Review & Submit</h2>
            <div className="space-y-4 text-sm bg-surface/50 rounded-xl p-4 border border-white/[0.05]">
              <div className="grid grid-cols-3 gap-2 border-b border-white/[0.05] pb-3">
                <span className="text-text-muted">Patient:</span>
                <span className="col-span-2 font-medium">{patientName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-white/[0.05] pb-3">
                <span className="text-text-muted">{service === "RENEWAL" ? "Medication:" : "Lab Test:"}</span>
                <span className="col-span-2 font-medium">{conditionKey}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-white/[0.05] pb-3">
                <span className="text-text-muted">Vitals:</span>
                <span className="col-span-2 font-mono text-primary">{systolic}/{diastolic} mmHg, {heartRate} bpm</span>
              </div>
              <div>
                <span className="block text-text-muted mb-1">Notes:</span>
                <p className="text-text-secondary italic">{freeText || "None provided."}</p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2 rounded-full border border-white/[0.1] hover:bg-surface-alt transition-colors font-medium">
            Back
          </button>
        ) : <div />}

        {step < 3 ? (
          <button 
            onClick={handleNext} 
            disabled={!patientName || !conditionKey}
            className="px-6 py-2 rounded-full bg-primary text-surface font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_var(--color-primary-glow)]"
          >
            Continue
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-8 py-2 rounded-full bg-primary text-surface font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:animate-pulse shadow-[0_0_15px_var(--color-primary-glow)]"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        )}
      </div>

      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-surface border border-danger/30 rounded-2xl p-8 shadow-[0_0_40px_var(--color-danger-glow)] text-center animate-scale-in">
            <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-danger mb-4">Immediate Attention Required</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Based on your responses, you need to be connected with a care coordinator for synchronous evaluation. Your request will be prioritized.
            </p>
            <button 
              onClick={submitEscalated}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-danger text-white font-bold hover:bg-danger-light transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Routing..." : "Proceed to Live Care Queue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
