# Issue 14 — Provider Case Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **Request info** and **Escalate** buttons to the inline detail panel. Both actions update local state only — consistent with `closeCase` — and will be wired to real API routes when the backend (issues 1–7) lands.

**Architecture:** Pure client-side state mutations, no new API routes. `Case.status` gains `"escalated"`. The detail panel renders inline confirm/input UIs so the provider never leaves the queue. `"escalated"` cases are filtered out of the queue automatically (same logic as `"closed"`).

**Tech Stack:** React useState · existing `.provider-workspace` CSS · `src/lib/types.ts` · `src/app/provider/page.tsx`

---

## File map

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `"escalated"` to `status` union; add `escalatedAt: number \| null` |
| `src/app/globals.css` | Add `.btn-danger` style for the Escalate button |
| `src/app/provider/page.tsx` | Add `requestInfo` / `escalateCase` local-state functions; pass to `CaseDetail`; render inline action UIs |

---

## Task 1: Extend the Case type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Update status union and add escalatedAt**

```ts
export type CaseType =
  | "med-renewal"
  | "lab-followup"
  | "chronic-condition-check-in";

export type Lane =
  | "needs-sync"
  | "async-pending"
  | "async-ready";

export type Case = {
  id: string;
  type: CaseType;
  lane: Lane;
  answers: Record<string, boolean>;
  redFlags: boolean;
  missing: string | null;
  freeText: string;
  packet: string | null;
  status: "open" | "closed" | "escalated";
  createdAt: number;
  closedAt: number | null;
  escalatedAt: number | null;
};
```

- [ ] **Commit**
```bash
git add src/lib/types.ts
git commit -m "feat(types): add escalated status and escalatedAt field"
```

---

## Task 2: Add .btn-danger CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Add after `.btn-ghost:hover`**

```css
.provider-workspace .btn-danger {
  background: transparent;
  color: var(--sync-fg);
  border: 1px solid var(--sync-fg);
}
.provider-workspace .btn-danger:hover {
  background: var(--sync-bg);
}
```

- [ ] **Commit**
```bash
git add src/app/globals.css
git commit -m "feat(styles): add btn-danger for escalate action"
```

---

## Task 3: Wire actions in page.tsx and update detail panel

**Files:**
- Modify: `src/app/provider/page.tsx`

### 3a — Add requestInfo and escalateCase after closeCase

- [ ] **Add both local-state functions**

```ts
function requestInfo(id: string, message: string) {
  setCases((prev) =>
    prev.map((x) =>
      x.id === id
        ? { ...x, lane: "async-pending" as const, missing: message }
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
```

### 3b — Pass callbacks to CaseDetail

- [ ] **Update the CaseDetail call**

```tsx
<CaseDetail
  c={selected}
  generating={generatingId === selected.id}
  attested={attested}
  onAttestChange={setAttested}
  onClose={() => closeCase(selected.id)}
  onRequestInfo={(msg) => requestInfo(selected.id, msg)}
  onEscalate={() => escalateCase(selected.id)}
/>
```

### 3c — Update CaseDetail props, add local state, update render

- [ ] **New signature**

```ts
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
})
```

- [ ] **Add inline UI state at the top of CaseDetail**

```ts
const [showRequestForm, setShowRequestForm] = useState(false);
const [requestMsg, setRequestMsg] = useState("");
const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
```

- [ ] **Add escalated stamp** — insert between the `"closed"` and `"needs-sync"` branches

```tsx
) : c.status === "escalated" ? (
  <div className="panel">
    <span className="closed-stamp" style={{ color: "var(--sync-fg)" }}>
      ⚡ Escalated — routed to urgent live visit
    </span>
  </div>
) : c.lane === "needs-sync" ? (
```

- [ ] **Replace async-ready action panel** with Close + Request info + Escalate

```tsx
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
  <button
    type="button"
    className="btn-close"
    disabled={!attested}
    onClick={onClose}
  >
    Attest &amp; close
  </button>

  {showRequestForm ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        autoFocus
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
  ) : (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => setShowRequestForm(true)}
    >
      Request info
    </button>
  )}

  {showEscalateConfirm ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="sync-note">
        Escalating routes this case to an{" "}
        <strong>urgent live visit</strong> and removes it from the async queue.
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
  ) : (
    <button
      type="button"
      className="btn-danger"
      onClick={() => setShowEscalateConfirm(true)}
    >
      Escalate
    </button>
  )}
</div>
```

- [ ] **Add Request info + Escalate to the async-pending panel** (after the disabled close button — same inline form/confirm blocks, no attestation row)

- [ ] **Run lint**
```bash
npm run lint
# Expected: no errors
```

- [ ] **Commit**
```bash
git add src/app/provider/page.tsx
git commit -m "feat(provider): add Request info and Escalate actions to detail panel"
```

---

## Task 4: Verify end-to-end in the browser

- [ ] **Boot dev server**: `npm run dev` → open `http://localhost:3000/provider`

- [ ] **Request info flow**
  1. Select an `async-ready` or `async-pending` case
  2. Click "Request info" → inline input appears
  3. Type "recent A1c lab result" → click "Send request"
  4. Queue card updates to `async-pending` with "missing: recent A1c lab result"

- [ ] **Escalate flow**
  1. Select an `async-ready` case → click "Escalate" → confirmation text appears
  2. Click "Confirm escalate"
  3. Detail panel shows "⚡ Escalated — routed to urgent live visit"
  4. Case disappears from the left queue

- [ ] **Close flow unchanged**
  1. Select `async-ready` → check attestation → "Attest & close" enables → click it → "✓ Closed async" shown

- [ ] **needs-sync cases unchanged** — no new buttons (already shows "Booked for live visit")
