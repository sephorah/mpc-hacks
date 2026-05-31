"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/app/_components/GlassCard";
import { StatusPill } from "@/app/_components/StatusPill";
import { SafetyFlagBadge } from "@/app/_components/SafetyFlagBadge";
import type { PatientCase } from "@/domain";

export default function ProviderCaseReview() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<PatientCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [attestNotes, setAttestNotes] = useState("");
  const [escalateReason, setEscalateReason] = useState("Needs examination");
  const [escalateNotes, setEscalateNotes] = useState("");
  
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data.case);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const handleAction = async (action: 'attest' | 'escalate') => {
    setIsSubmitting(true);
    try {
      const payload = action === 'attest' 
        ? { action, doctorId: "Dr. Lavoie", notes: attestNotes }
        : { action, reason: escalateReason + (escalateNotes ? ` - ${escalateNotes}` : "") };
        
      await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      router.push('/provider');
    } catch (e) {
      console.error(e);
      alert("Failed to process action");
      setIsSubmitting(false);
    }
  };

  const handleSaveSummary = async () => {
    setIsSavingSummary(true);
    try {
      await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_summary", summary: editedSummary })
      });
      setCaseData(prev => prev ? { ...prev, freeTextSummary: editedSummary } : null);
      setIsEditingSummary(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save summary");
    } finally {
      setIsSavingSummary(false);
    }
  };

  if (isLoading || !caseData) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="h-10 bg-surface-alt rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-surface-alt rounded-2xl" />
          <div className="h-96 bg-surface-alt rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.push('/provider')} className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1">
        ← Back to Dashboard
      </button>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">{caseData.patientName}</h1>
        <StatusPill status={caseData.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="p-6">
            <h2 className="text-lg font-semibold mb-4 text-accent border-b border-white/[0.05] pb-2">
              {caseData.serviceType.replace(/_/g, " ")}: {caseData.conditionKey}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(caseData.structuredData).map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-text-muted uppercase mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="font-medium">{String(v)}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-6">
            <GlassCard padding="p-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase mb-4">Vitals</h3>
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                  <span className="text-text-secondary">BP</span>
                  <span className="text-primary font-bold">{caseData.structuredData.vitals ? (caseData.structuredData.vitals as any).systolicBP : '120'} / {caseData.structuredData.vitals ? (caseData.structuredData.vitals as any).diastolicBP : '80'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">HR</span>
                  <span className="text-primary font-bold">{caseData.structuredData.vitals ? (caseData.structuredData.vitals as any).heartRate : '72'} bpm</span>
                </div>
              </div>
            </GlassCard>

            {caseData.safetyFlags.length > 0 && (
              <GlassCard padding="p-6" className="border-danger/20 bg-danger/5">
                <h3 className="text-sm font-semibold text-danger uppercase mb-4">Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {caseData.safetyFlags.map(f => (
                    <SafetyFlagBadge key={f} flag={f} />
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-20"></div>
            <GlassCard padding="p-6" className="relative border-accent/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-accent text-lg">✨</span>
                  <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">AI Summary</h3>
                </div>
                {!isEditingSummary && (
                  <button onClick={() => {
                    setEditedSummary(caseData.freeTextSummary || caseData.freeText);
                    setIsEditingSummary(true);
                  }} className="text-xs font-semibold text-accent hover:text-accent-light transition-colors">
                    EDIT
                  </button>
                )}
              </div>
              
              {isEditingSummary ? (
                <div className="space-y-3 animate-fade-in">
                  <textarea
                    value={editedSummary}
                    onChange={e => setEditedSummary(e.target.value)}
                    className="w-full h-32 bg-surface border border-accent/30 rounded-xl p-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-y leading-relaxed text-text-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingSummary(false)}
                      disabled={isSavingSummary}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveSummary}
                      disabled={isSavingSummary}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium bg-accent/20 text-accent hover:bg-accent hover:text-white transition-colors"
                    >
                      {isSavingSummary ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="text-sm font-medium leading-relaxed space-y-2 cursor-pointer hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors group"
                  onClick={() => {
                    setEditedSummary(caseData.freeTextSummary || caseData.freeText);
                    setIsEditingSummary(true);
                  }}
                  title="Click to edit"
                >
                  {(caseData.freeTextSummary || caseData.freeText).split('\n').map((line, i) => {
                    if (!line.trim()) return null;
                    const isBullet = line.trim().startsWith('-');
                    return (
                      <p key={i} className={`flex items-start ${isBullet ? 'gap-2' : ''}`}>
                        {isBullet ? (
                          <>
                            <span className="text-accent mt-0.5">•</span>
                            <span>{line.replace(/^-/, '').trim()}</span>
                          </>
                        ) : (
                          <span>{line}</span>
                        )}
                      </p>
                    );
                  })}
                  <div className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-4 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Click anywhere to edit
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        <div className="space-y-6">
          <GlassCard padding="p-6" className="border-success/20">
            <h3 className="text-lg font-bold text-success mb-4 flex items-center gap-2">
              <span>✅</span> Attest & Resolve
            </h3>
            <textarea 
              value={attestNotes}
              onChange={e => setAttestNotes(e.target.value)}
              placeholder="Clinical notes (optional)..."
              className="w-full h-24 bg-surface border border-white/[0.1] rounded-xl p-3 text-sm focus:border-success focus:ring-1 focus:ring-success focus:outline-none resize-none mb-4"
            />
            <button 
              onClick={() => handleAction('attest')}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-success/20 text-success font-bold hover:bg-success hover:text-surface transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Attest Case"}
            </button>
          </GlassCard>

          <GlassCard padding="p-6" className="border-danger/20">
            <h3 className="text-lg font-bold text-danger mb-4 flex items-center gap-2">
              <span>⚠️</span> Escalate to Sync Care
            </h3>
            <select 
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              className="w-full bg-surface border border-white/[0.1] rounded-xl p-3 text-sm focus:border-danger focus:outline-none mb-4"
            >
              <option>Needs examination</option>
              <option>Clinical concern</option>
              <option>Patient request</option>
              <option>Complex case</option>
            </select>
            <textarea 
              value={escalateNotes}
              onChange={e => setEscalateNotes(e.target.value)}
              placeholder="Reason for escalation..."
              className="w-full h-24 bg-surface border border-white/[0.1] rounded-xl p-3 text-sm focus:border-danger focus:ring-1 focus:ring-danger focus:outline-none resize-none mb-4"
            />
            <button 
              onClick={() => handleAction('escalate')}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-danger/20 text-danger font-bold hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Escalate"}
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
