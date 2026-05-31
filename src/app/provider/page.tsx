"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Case, CaseType, Lane } from "@/lib/types";

const LANE_ORDER: Lane[] = ["needs-sync", "async-ready", "async-pending"];


const TYPE_LABEL: Record<CaseType, string> = {
  "med-renewal": "Renewal",
  "lab-followup": "Lab follow-up",
  "chronic-condition-check-in": "Chronic check-in",
  "general-enquiry": "General enquiry",
};

// Baseline seeds the stats at a realistic mid-session value for demo.
// Both metrics increment by asyncClosed (cases closed without a live visit this session).
const MOCK_SYNC_SLOTS_FREED = 7;
const MOCK_CASES_PER_HOUR = 11.2;

// Mock patient messages — will be templated dynamically later
const PATIENT_MESSAGES: Partial<Record<CaseType, string>> = {
  "med-renewal":
    '"Your renewal is approved. No visit needed. Your prescription will be sent to your pharmacy within 24 hours."',
  "lab-followup":
    '"Your lab results have been reviewed. Everything looks good — no changes to your care plan at this time."',
  "chronic-condition-check-in":
    '"Your check-in has been reviewed. Your current treatment plan remains appropriate."',
};

function laneLabel(lane: Lane): string {
  return lane.replace(/-/g, " ");
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function laneSubtitle(c: Case): string {
  if (c.lane === "async-ready")
    return c.type === "lab-followup"
      ? "Lab received · ready to close"
      : "Ready to close";
  if (c.lane === "async-pending")
    return `Waiting on: ${c.missing ?? "patient info"}`;
  return "Red flag · → live visit";
}

const PACKETS: Record<string, string> = {
  "c-7f3a":
    "Type 2 diabetic, routine quarterly follow-up. No new symptoms reported. Awaiting lab result to confirm control before renewing metformin. No red flags.",
  "c-2b91":
    "Stable on atorvastatin, no reported side effects, home BP readings normal. Straightforward renewal — no labs outstanding, no red flags.",
};
// PACKETS is used as a local fallback for seed cases not stored server-side

const PACKET_FALLBACK: Record<CaseType, string> = {
  "med-renewal":
    "• Medication: renewal request — see patient note above\n• Context: review side-effect history and last refill date before approving\n• Note: summary generation failed — attest based on raw intake",
  "lab-followup":
    "• Test: lab follow-up request — see patient note above\n• Values: check uploaded results before responding\n• Note: summary generation failed — attest based on raw intake",
  "chronic-condition-check-in":
    "• Condition: chronic care check-in — see patient note above\n• Measurements: verify reported values against care plan targets\n• Note: summary generation failed — attest based on raw intake",
  "general-enquiry":
    "• Concern: general enquiry — see patient note above\n• Detail: review full intake before responding\n• Note: summary generation failed — attest based on raw intake",
};
const ATTEST_CLINICIAN = "Dr. A. Moreau, MD · #QC-88421";

function makeSeed(): Case[] {
  const min = (n: number) => Date.now() - n * 60_000;
  return [
    {
      patient_id: null,
      id: "c-d04e",
      type: "med-renewal",
      lane: "needs-sync",
      answers: {},
      redFlags: true,
      missing: null,
      freeText:
        "Want my blood pressure med renewed but Ive had chest tightness twice this week.",
      packet: null,
      status: "open",
      cohortId: null,
      createdAt: min(2),
      closedAt: null,
      escalatedAt: null,
    },
    {
      patient_id: null,
      id: "c-2b91",
      type: "med-renewal",
      lane: "async-ready",
      answers: {},
      redFlags: false,
      missing: null,
      freeText: "Need my statin refilled, no side effects, BP stable at home.",
      packet: null,
      status: "open",
      cohortId: "cohort-med-renewal:async-ready",
      createdAt: min(6),
      closedAt: null,
      escalatedAt: null,
    },
    {
      patient_id: null,
      id: "c-e5b2",
      type: "med-renewal",
      lane: "async-ready",
      answers: {},
      redFlags: false,
      missing: null,
      freeText: "Monthly blood pressure medication, no changes needed.",
      packet: null,
      status: "open",
      cohortId: "cohort-med-renewal:async-ready",
      createdAt: min(5),
      closedAt: null,
      escalatedAt: null,
    },
    {
      patient_id: null,
      id: "c-7f3a",
      type: "lab-followup",
      lane: "async-pending",
      answers: {},
      redFlags: false,
      missing: "lab result",
      freeText:
        "Diabetic, due for quarterly check. Feeling fine, no new symptoms.",
      packet: null,
      status: "open",
      cohortId: "cohort-lab-followup:async-pending",
      createdAt: min(4),
      closedAt: null,
      escalatedAt: null,
    },
    {
      patient_id: null,
      id: "c-a3f1",
      type: "med-renewal",
      lane: "async-pending",
      answers: {},
      redFlags: false,
      missing: "prescription photo or required documentation",
      freeText: "Need to renew my inhaler prescription.",
      packet: null,
      status: "open",
      cohortId: "cohort-med-renewal:async-pending",
      createdAt: min(8),
      closedAt: null,
      escalatedAt: null,
    },
  ];
}

function Badge({ lane, inline = false }: { lane: Lane; inline?: boolean }) {
  return (
    <span
      className={`badge ${lane}`}
      style={inline ? { verticalAlign: "middle" } : undefined}
    >
      <span className="dot" />
      {laneLabel(lane)}
    </span>
  );
}

function QueueCard({
  c,
  isSelected,
  isArriving,
  onClick,
}: {
  c: Case;
  isSelected: boolean;
  isArriving: boolean;
  onClick: () => void;
}) {
  const preview =
    c.lane === "async-pending"
      ? `missing: ${c.missing ?? "patient info"}`
      : c.freeText?.slice(0, 55) ?? "—";
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`case ${isSelected ? "active" : ""} ${isArriving ? "arriving" : ""}`}
      onClick={onClick}
    >
      <div className="row1">
        <span className="type">{TYPE_LABEL[c.type]}</span>
        <span className="meta">{c.id.slice(0, 6)} · {timeAgo(c.createdAt)}</span>
      </div>
      <div className="row2">
        <Badge lane={c.lane} />
        <span className="subtitle">{preview}</span>
      </div>
    </button>
  );
}

export default function ProviderWorkspace() {
  const seed = useMemo(makeSeed, []);
  const [cases, setCases] = useState<Case[]>(seed);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [arriving, setArriving] = useState<Set<string>>(new Set());
  const [showClosed, setShowClosed] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/case");
      if (res.ok) {
        const json = await res.json();
        const data: Case[] = json.data ?? [];
        setCases((prev) => {
          const inactiveIds = new Set(
            prev
              .filter((c) => c.status === "closed" || c.status === "escalated")
              .map((c) => c.id),
          );
          const merged = data.map((c) =>
            inactiveIds.has(c.id)
              ? { ...c, status: prev.find((x) => x.id === c.id)?.status ?? c.status }
              : c,
          );
          const serverIds = new Set(data.map((c) => c.id));
          const localOnly = prev.filter((c) => !serverIds.has(c.id));
          return [...merged, ...localOnly];
        });
      }
    } catch {
      // server not up yet — keep current state
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2_500);
    return () => clearInterval(id);
  }, [poll]);

  // Depend only on selectedId — excluding `cases` prevents the 15s poll from
  // cancelling an in-flight Gemini request every time the case list refreshes.
  useEffect(() => {
    if (!selectedId) return;
    const c = cases.find((x) => x.id === selectedId);
    if (!c || c.packet) return;
    if (c.status !== "open") return;

    setGeneratingId(selectedId);
    const capturedId = selectedId;
    const capturedType = c.type;
    let cancelled = false;

    fetch(`/api/case/${capturedId}/packet`, { method: "POST" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const packet: string | null = json.data?.packet ?? PACKETS[capturedId] ?? PACKET_FALLBACK[capturedType];
        setCases((prev) =>
          prev.map((x) => (x.id === capturedId ? { ...x, packet } : x)),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCases((prev) =>
          prev.map((x) =>
            x.id === capturedId ? { ...x, packet: PACKETS[capturedId] ?? PACKET_FALLBACK[capturedType] } : x,
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setGeneratingId(null);
      });

    return () => {
      cancelled = true;
      setGeneratingId(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function select(id: string) {
    setSelectedId(id);
  }

  function closeCase(id: string) {
    const c = cases.find((x) => x.id === id);
    if (!c || c.lane === "needs-sync") return;
    // Optimistic update
    setCases((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: "closed", closedAt: Date.now() } : x,
      ),
    );
    fetch(`/api/case/${id}/close`, { method: "POST" }).catch(() => {
      // Server not up yet — local close stands for the demo
    });
  }

  function batchClose(ids: string[]) {
    const closedAt = Date.now();
    setCases((prev) =>
      prev.map((c) =>
        ids.includes(c.id) && c.lane !== "needs-sync"
          ? { ...c, status: "closed" as const, closedAt }
          : c,
      ),
    );
    setSelectedId(null);
    for (const id of ids) {
      fetch(`/api/case/${id}/close`, { method: "POST" }).catch(() => {});
    }
  }

  function requestInfo(id: string, message: string) {
    setCases((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              lane: "async-pending" as const,
              missing: message,
              packet: null,
            }
          : x,
      ),
    );
  }

  function escalateCase(id: string) {
    setCases((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, status: "escalated" as const, escalatedAt: Date.now() }
          : x,
      ),
    );
  }

  function markArriving(id: string) {
    setArriving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setArriving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 600);
  }

  function simArrival() {
    const id = `c-${Math.random().toString(16).slice(2, 6)}`;
    const c: Case = {
      patient_id: null,
      id,
      type: "med-renewal",
      lane: "async-ready",
      answers: {},
      redFlags: false,
      missing: null,
      freeText: "Birth control renewal, no issues, no new meds.",
      packet: null,
      status: "open",
      cohortId: "cohort-med-renewal:async-ready",
      createdAt: Date.now(),
      closedAt: null,
      escalatedAt: null,
    };
    setCases((prev) => [c, ...prev]);
    markArriving(id);
  }

  function simLab() {
    setCases((prev) => {
      const target = prev.find(
        (x) => x.lane === "async-pending" && x.status === "open",
      );
      if (!target) return prev;
      markArriving(target.id);
      return prev.map((x) =>
        x.id === target.id
          ? { ...x, lane: "async-ready", missing: null, cohortId: `cohort-${x.type}:async-ready`, createdAt: Date.now() }
          : x,
      );
    });
  }

  const open = useMemo(
    () => cases.filter((c) => c.status === "open"),
    [cases],
  );

  const closed = useMemo(
    () => cases.filter((c) => c.status !== "open").sort((a, b) => (b.closedAt ?? b.createdAt) - (a.closedAt ?? a.createdAt)),
    [cases],
  );

  // Cases closed async (didn't need a live visit) — drives the stats
  const asyncClosed = useMemo(
    () => cases.filter((c) => c.status === "closed" && c.lane !== "needs-sync").length,
    [cases],
  );

  const displayed = showClosed ? closed : open;

  // One column per lane status; within each column, cases grouped by type
  const laneColumns = useMemo(() => {
    return LANE_ORDER.map((lane) => {
      const laneCases = displayed.filter((c) => c.lane === lane);
      const typeMap = new Map<CaseType, Case[]>();
      for (const c of laneCases) {
        if (!typeMap.has(c.type)) typeMap.set(c.type, []);
        typeMap.get(c.type)!.push(c);
      }
      const typeGroups = [...typeMap.entries()].map(([type, cases]) => ({ type, cases }));
      return { lane, typeGroups, total: laneCases.length };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed]);

  const selected = cases.find((c) => c.id === selectedId) ?? null;
  const cohortReady = selected?.cohortId
    ? cases.filter(
        (c) =>
          c.cohortId === selected.cohortId &&
          c.status === "open",
      )
    : [];

  return (
    <>
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Sync slots freed today</span>
          <span className="stat-value">{MOCK_SYNC_SLOTS_FREED + asyncClosed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cases / clinician-hour</span>
          <span className="stat-value">{MOCK_CASES_PER_HOUR.toFixed(1)}</span>
        </div>
      </div>

      <div className="layout">
        <div className="queues-bar">
          <div className="queues-head">
            <span className="queue-title">Queue</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="count">
                {showClosed ? closed.length : open.length}{" "}
                {showClosed ? "closed" : "open"}
              </span>
              <button
                type="button"
                className="btn-filter"
                onClick={poll}
                title="Refresh"
              >↻</button>
            </div>
          </div>

          <div className="queues-toggle">
            <button
              type="button"
              className={`btn-filter ${!showClosed ? "active" : ""}`}
              onClick={() => { setShowClosed(false); setSelectedId(null); }}
            >Open</button>
            <button
              type="button"
              className={`btn-filter ${showClosed ? "active" : ""}`}
              onClick={() => { setShowClosed(true); setSelectedId(null); }}
            >Closed</button>
          </div>

          <div className="queues-cols">
            {laneColumns.map(({ lane, typeGroups, total }) => (
              <div key={lane} className="queue-col">
                <div className={`queue-col-head lane-${lane}`}>
                  <Badge lane={lane} />
                  <span className="queue-col-count">{total}</span>
                </div>
                {typeGroups.map(({ type, cases: typeCases }) => (
                  <div key={type} className="type-group">
                    <div className="type-group-header">
                      {TYPE_LABEL[type]}
                      <span className="type-group-count">{typeCases.length}</span>
                    </div>
                    {typeCases.map((c) => (
                      <QueueCard
                        key={c.id}
                        c={c}
                        isSelected={c.id === selectedId}
                        isArriving={arriving.has(c.id)}
                        onClick={() => select(c.id)}
                      />
                    ))}
                  </div>
                ))}
                {total === 0 && (
                  <div className="queue-empty">No cases</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div
            className="detail-backdrop"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
        )}
        <aside className={`detail${selected ? " open" : ""}`}>
          {selected && (
            <div className="detail-inner">
              <div className="detail-topbar">
                <button
                  type="button"
                  className="btn-detail-close"
                  onClick={() => setSelectedId(null)}
                  title="Close panel"
                >×</button>
              </div>
              <CaseDetail
                key={selected.id}
                c={selected}
                generating={generatingId === selected.id}
                cohortReady={cohortReady}
                onClose={() => closeCase(selected.id)}
                onBatchClose={batchClose}
                onEscalate={() => escalateCase(selected.id)}
              />
            </div>
          )}
        </aside>
      </div>

      {/* <div className="sim">
        <span className="label">demo controls ↓</span>
        <button type="button" onClick={simArrival}>
          + patient submits
        </button>
        <button type="button" onClick={simLab}>
          patient sends lab
        </button>
      </div> */}
    </>
  );
}

function CaseDetail({
  c,
  generating,
  cohortReady,
  onClose,
  onBatchClose,
  onEscalate,
}: {
  c: Case;
  generating: boolean;
  cohortReady: Case[];
  onClose: () => void;
  onBatchClose: (ids: string[]) => void;
  onEscalate: () => void;
}) {
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [attestName, setAttestName] = useState(ATTEST_CLINICIAN);
  const defaultMsg =
    PATIENT_MESSAGES[c.type] ??
    '"Your care team has reviewed your request and will follow up shortly."';
  const [editableMsg, setEditableMsg] = useState(defaultMsg);

  return (
    <>
      <div className="detail-header">
        <h1>{TYPE_LABEL[c.type]}</h1>
        <div className="detail-sub">
          <span className="detail-case-id">{c.id}</span>
          <span className="detail-dot">·</span>
          <span className="detail-time">submitted {timeAgo(c.createdAt)} ago</span>
          <span className="detail-dot">·</span>
          <Badge lane={c.lane} />
        </div>
      </div>

      <div className="panel">
        <h3>Intake</h3>
        <div className="intake-kv">
          <div className="intake-row">
            <span className="intake-k">Request type</span>
            <span className="intake-v">{TYPE_LABEL[c.type]}</span>
          </div>
          <div className="intake-row">
            <span className="intake-k">Red-flag screen</span>
            <span className="intake-v">
              {c.redFlags ? (
                <span className="check-bad">⚠ tripped — {c.freeText?.slice(0, 50)}</span>
              ) : (
                <span className="check-ok">✓ No red flags</span>
              )}
            </span>
          </div>
          {c.missing && (
            <div className="intake-row">
              <span className="intake-k">Missing</span>
              <span className="intake-v check-pending">⏳ {c.missing}</span>
            </div>
          )}
          <div className="intake-row">
            <span className="intake-k">Patient note</span>
            <span className="intake-v intake-note">{c.freeText || "—"}</span>
          </div>
        </div>
      </div>

      {c.status === "open" && (
        <div className="panel dashed">
          <h3 style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Decision packet · <span className="ai-tag">AI GENERATED</span>
          </h3>
          <div className="packet">
            {generating || !c.packet ? (
              <span className="gen">
                <span className="spinner" /> generating decision packet…
              </span>
            ) : (
              <pre className="packet-bullets">{c.packet}</pre>
            )}
          </div>
        </div>
      )}

      {c.status === "closed" ? (
        <div className="panel">
          <span className="closed-stamp">
            ✓ Closed async — {ATTEST_CLINICIAN}
          </span>
        </div>
      ) : c.status === "escalated" ? (
        <div className="panel">
          <span className="closed-stamp" style={{ color: "var(--sync-fg)" }}>
            ⚡ Escalated — routed to urgent live visit
          </span>
        </div>
      ) : c.lane === "needs-sync" ? (
        <div className="panel">
          <h3>Disposition</h3>
          <div className="sync-note">
            Red flag tripped on intake. This case{" "}
            <strong>cannot close async</strong> — routed to a live visit. Intake
            is preserved so the clinician starts with full context; no time lost
            re-collecting.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {!showEscalateConfirm && (
              <>
                <button type="button" className="btn-ghost">
                  → Booked for live visit
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setShowEscalateConfirm(true)}
                >
                  Escalate
                </button>
              </>
            )}
            {showEscalateConfirm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="sync-note">
                  Escalating flags this case for <strong>priority urgent care</strong> and
                  alerts the on-call team immediately.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => { onEscalate(); setShowEscalateConfirm(false); }}
                  >
                    Confirm escalate
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowEscalateConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {(c.lane === "async-ready" || c.lane === "async-pending") &&
            !generating && !!c.packet && (
            <div className="panel dashed">
              <h3>
                Patient will receive{" "}
                <span className="read-only-tag">editable</span>
              </h3>
              <textarea
                className="patient-msg-edit"
                value={editableMsg}
                onChange={(e) => setEditableMsg(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {c.lane === "async-pending" ? (
            <>
              <div className="panel">
                <h3>Blocking</h3>
                <div className="missing-box">
                  ⏳ Waiting on patient: <strong>{c.missing}</strong>
                </div>
              </div>
              <div className="panel actions">
                {!showEscalateConfirm && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="btn-close" disabled>
                      Close case · blocked
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setShowEscalateConfirm(true)}
                    >
                      Escalate
                    </button>
                  </div>
                )}
                {showEscalateConfirm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="sync-note">
                      Escalating routes this case to an <strong>urgent live visit</strong>{" "}
                      and removes it from the async queue.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => { onEscalate(); setShowEscalateConfirm(false); }}
                      >
                        Confirm escalate
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setShowEscalateConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="panel actions">
              {!showBatchConfirm && !showEscalateConfirm && (
                <div className="attest-row">
                  <input
                    type="text"
                    className="attest-input"
                    value={attestName}
                    onChange={(e) => setAttestName(e.target.value)}
                    placeholder="Clinician name"
                  />
                  <button
                    type="button"
                    className="btn-close"
                    disabled={!attestName.trim()}
                    onClick={onClose}
                  >
                    ✓ Attest &amp; close
                  </button>
                  {/* {cohortReady.length >= 2 && (
                    <button
                      type="button"
                      className="btn-batch"
                      disabled={!attestName.trim()}
                      onClick={() => setShowBatchConfirm(true)}
                    >
                      Close all {cohortReady.length} similar
                    </button>
                  )} */}
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowEscalateConfirm(true)}
                  >
                    Escalate
                  </button>
                </div>
              )}

              {showBatchConfirm && (
                <div className="batch-confirm">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Close {cohortReady.length} cases async?
                  </div>
                  <div className="batch-ids">
                    {cohortReady.map((x) => x.id).join(" · ")}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        onBatchClose(cohortReady.map((x) => x.id));
                        setShowBatchConfirm(false);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowBatchConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showEscalateConfirm && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="sync-note">
                    Escalating routes this case to an <strong>urgent live visit</strong>{" "}
                    and removes it from the async queue.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => { onEscalate(); setShowEscalateConfirm(false); }}
                    >
                      Confirm escalate
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowEscalateConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
