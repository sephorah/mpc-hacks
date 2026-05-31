"use client";

import { useEffect, useMemo, useState } from "react";
import type { Case, CaseType, Lane } from "@/lib/types";

const TYPE_LABEL: Record<CaseType, string> = {
  "med-renewal": "renewal",
  "lab-followup": "lab followup",
  "chronic-condition-check-in": "chronic condition check in",
};

function laneLabel(lane: Lane): string {
  return lane.replace(/-/g, " ");
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const PACKETS: Record<string, string> = {
  "c-7f3a":
    "Type 2 diabetic, routine quarterly follow-up. No new symptoms reported. Awaiting A1c to confirm control before renewing metformin. No red flags.",
  "c-2b91":
    "Stable on atorvastatin, no reported side effects, home BP readings normal. Straightforward renewal — no labs outstanding, no red flags.",
};

const PACKET_FALLBACK = "Summary unavailable — using canned fallback.";
const ATTEST_CLINICIAN = "Dr. A. Moreau, MD";

function makeSeed(): Case[] {
  const min = (n: number) => Date.now() - n * 60_000;
  return [
    {
      id: "c-7f3a",
      type: "lab-followup",
      lane: "async-pending",
      answers: {},
      redFlags: false,
      missing: "recent A1c lab result",
      freeText:
        "Diabetic, due for quarterly check. Feeling fine, no new symptoms.",
      packet: null,
      status: "open",
      createdAt: min(4),
      closedAt: null,
      escalatedAt: null,
    },
    {
      id: "c-2b91",
      type: "med-renewal",
      lane: "async-ready",
      answers: {},
      redFlags: false,
      missing: null,
      freeText: "Need my statin refilled, no side effects, BP stable at home.",
      packet: null,
      status: "open",
      createdAt: min(6),
      closedAt: null,
      escalatedAt: null,
    },
    {
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
      createdAt: min(2),
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

export default function ProviderWorkspace() {
  const seed = useMemo(makeSeed, []);
  const [cases, setCases] = useState<Case[]>(seed);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [attested, setAttested] = useState(false);
  const [arriving, setArriving] = useState<Set<string>>(new Set());

  // Poll real API once it exists; preserve locally-closed/escalated cases on merge.
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/cases");
        if (res.ok) {
          const data: Case[] = await res.json();
          setCases((prev) => {
            const inactiveIds = new Set(
              prev
                .filter(
                  (c) => c.status === "closed" || c.status === "escalated",
                )
                .map((c) => c.id),
            );
            return data.map((c) =>
              inactiveIds.has(c.id)
                ? {
                    ...c,
                    status: prev.find((x) => x.id === c.id)?.status ?? c.status,
                  }
                : c,
            );
          });
        }
      } catch {
        // API not built yet (issues 1–4) — keep current state.
      }
    }
    poll();
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, []);

  // Simulate the one live LLM call when an async case is first opened.
  useEffect(() => {
    if (!selectedId) return;
    const c = cases.find((x) => x.id === selectedId);
    if (!c || c.packet) return;
    if (c.lane !== "async-ready" && c.lane !== "async-pending") return;

    setGeneratingId(selectedId);
    const capturedId = selectedId;
    const t = setTimeout(() => {
      setCases((prev) =>
        prev.map((x) =>
          x.id === capturedId
            ? { ...x, packet: PACKETS[capturedId] ?? PACKET_FALLBACK }
            : x,
        ),
      );
      setGeneratingId(null);
    }, 1100);
    return () => clearTimeout(t);
  }, [selectedId, cases]);

  function select(id: string) {
    setSelectedId(id);
    setAttested(false);
  }

  function closeCase(id: string) {
    const c = cases.find((x) => x.id === id);
    if (!c || c.lane === "needs-sync") return;
    setCases((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: "closed", closedAt: Date.now() } : x,
      ),
    );
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
      id,
      type: "med-renewal",
      lane: "async-ready",
      answers: {},
      redFlags: false,
      missing: null,
      freeText: "Birth control renewal, no issues, no new meds.",
      packet: null,
      status: "open",
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
          ? { ...x, lane: "async-ready", missing: null, createdAt: Date.now() }
          : x,
      );
    });
  }

  const open = cases.filter((c) => c.status === "open");
  const selected = cases.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <div className="layout">
        <aside className="queue">
          <div className="queue-head">
            <h2>Open cases</h2>
            <span className="count">{open.length} waiting</span>
          </div>
          <div>
            {open.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={c.id === selectedId}
                className={`case ${c.id === selectedId ? "active" : ""} ${
                  arriving.has(c.id) ? "arriving" : ""
                }`}
                onClick={() => select(c.id)}
              >
                <div className="row1">
                  <span className="type">{TYPE_LABEL[c.type]}</span>
                  <span className="meta">
                    {c.id} · {timeAgo(c.createdAt)}
                  </span>
                </div>
                <div className="row2">
                  <Badge lane={c.lane} />
                  {c.missing ? (
                    <span className="missing">missing: {c.missing}</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="detail">
          {!selected ? (
            <div className="empty">Select a case from the queue</div>
          ) : (
            <CaseDetail
              key={selected.id}
              c={selected}
              generating={generatingId === selected.id}
              attested={attested}
              onAttestChange={setAttested}
              onClose={() => closeCase(selected.id)}
              onRequestInfo={(msg) => requestInfo(selected.id, msg)}
              onEscalate={() => escalateCase(selected.id)}
            />
          )}
        </main>
      </div>

      <div className="sim">
        <span className="label">demo controls ↓</span>
        <button type="button" onClick={simArrival}>
          + patient submits
        </button>
        <button type="button" onClick={simLab}>
          patient sends lab
        </button>
      </div>
    </>
  );
}

function ActionButtons({
  showRequestForm,
  setShowRequestForm,
  requestMsg,
  setRequestMsg,
  showEscalateConfirm,
  setShowEscalateConfirm,
  onRequestInfo,
  onEscalate,
}: {
  showRequestForm: boolean;
  setShowRequestForm: (v: boolean) => void;
  requestMsg: string;
  setRequestMsg: (v: string) => void;
  showEscalateConfirm: boolean;
  setShowEscalateConfirm: (v: boolean) => void;
  onRequestInfo: (msg: string) => void;
  onEscalate: () => void;
}) {
  return (
    <>
      {!showRequestForm && !showEscalateConfirm && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowRequestForm(true)}
          >
            Request info
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

      {showRequestForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="What do you need from the patient?"
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontFamily: "var(--font-plex-sans), sans-serif",
              fontSize: 14,
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              disabled={!requestMsg.trim()}
              onClick={() => {
                onRequestInfo(requestMsg.trim());
                setShowRequestForm(false);
                setRequestMsg("");
              }}
            >
              Send request
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setShowRequestForm(false);
                setRequestMsg("");
              }}
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
              onClick={() => {
                onEscalate();
                setShowEscalateConfirm(false);
              }}
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
    </>
  );
}

function CaseDetail({
  c,
  generating,
  attested,
  onAttestChange,
  onClose,
  onRequestInfo,
  onEscalate,
}: {
  c: Case;
  generating: boolean;
  attested: boolean;
  onAttestChange: (v: boolean) => void;
  onClose: () => void;
  onRequestInfo: (message: string) => void;
  onEscalate: () => void;
}) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);

  return (
    <>
      <h1>{TYPE_LABEL[c.type]}</h1>
      <div className="sub">
        {c.id} · submitted {timeAgo(c.createdAt)} ago ·{" "}
        <Badge lane={c.lane} inline />
      </div>

      <div className="panel">
        <h3>Intake</h3>
        <div className="kv">
          <span className="k">Request type</span>
          <span className="v" style={{ textTransform: "capitalize" }}>
            {TYPE_LABEL[c.type]}
          </span>
        </div>
        <div className="kv">
          <span className="k">Red-flag screen</span>
          <span className={`v ${c.redFlags ? "flag-bad" : "flag-ok"}`}>
            {c.redFlags ? "⚠ tripped — chest tightness" : "clear"}
          </span>
        </div>
        <div className="kv">
          <span className="k">Patient note</span>
          <span className="v" style={{ fontWeight: 400 }}>
            {c.freeText}
          </span>
        </div>
      </div>

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
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn-ghost">
              → Booked for live visit
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="panel">
            <h3>
              Decision packet{" "}
              <span className="packet">
                <span className="ai-tag">AI-generated</span>
              </span>
            </h3>
            <div className="packet">
              {generating || !c.packet ? (
                <span className="gen">
                  <span className="spinner" /> generating decision packet…
                </span>
              ) : (
                c.packet
              )}
            </div>
          </div>

          {c.lane === "async-pending" ? (
            <>
              <div className="panel">
                <h3>Blocking</h3>
                <div className="missing-box">
                  ⏳ Waiting on patient: <strong>{c.missing}</strong>
                </div>
              </div>
              <div className="panel actions">
                <div className="attest">
                  <input type="checkbox" disabled />
                  <span>
                    I authorize this renewal —{" "}
                    <span className="name">Dr. [clinician]</span>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn-close" disabled>
                    Close case · blocked
                  </button>
                  <ActionButtons
                    showRequestForm={showRequestForm}
                    setShowRequestForm={setShowRequestForm}
                    requestMsg={requestMsg}
                    setRequestMsg={setRequestMsg}
                    showEscalateConfirm={showEscalateConfirm}
                    setShowEscalateConfirm={setShowEscalateConfirm}
                    onRequestInfo={onRequestInfo}
                    onEscalate={onEscalate}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="panel actions">
              <h3>Clinician sign-off</h3>
              <div className="attest">
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => onAttestChange(e.target.checked)}
                />
                <span>
                  I authorize this renewal —{" "}
                  <span className="name">Dr. A. Moreau, MD · #QC-88421</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-close"
                  disabled={!attested}
                  onClick={onClose}
                >
                  Attest &amp; close
                </button>
                <ActionButtons
                  showRequestForm={showRequestForm}
                  setShowRequestForm={setShowRequestForm}
                  requestMsg={requestMsg}
                  setRequestMsg={setRequestMsg}
                  showEscalateConfirm={showEscalateConfirm}
                  setShowEscalateConfirm={setShowEscalateConfirm}
                  onRequestInfo={onRequestInfo}
                  onEscalate={onEscalate}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
