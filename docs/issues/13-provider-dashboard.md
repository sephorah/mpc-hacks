# Issue 13 — Provider workspace `/provider`

## What was built

Full interactive provider workspace at `/provider`. The page has been heavily iterated since the initial implementation — this document reflects the current state.

### Stats bar

Two stat cards sit above the workspace:

| Stat | Formula |
|------|---------|
| **Sync slots freed today** | `7 (baseline) + asyncClosed` |
| **Cases / clinician-hour** | `11.2 (baseline) + asyncClosed × 2` |

`asyncClosed` is a live `useMemo` counting cases with `status === "closed" && lane !== "needs-sync"` in the current session. Both stats increment in real time as the provider closes async cases. The baseline seeds the demo at a realistic mid-session value.

### Queue (left pane) — three lane columns

Three columns side by side, one per lane in priority order: **NEEDS SYNC → ASYNC READY → ASYNC PENDING**.

Each column header shows a lane badge (uppercase: NEEDS SYNC, ASYNC READY, ASYNC PENDING) and a case count.

Within each column, cases are grouped by case type under a tinted `type-group-header` pill (e.g. "Renewal 2"). Cards inside a group show:

- **Row 1:** case type label (left) · short ID + time ago (right)
- **Row 2:** lane badge (left) · preview text (right) — for async-pending the preview is "missing: …"; for others it's the first 55 chars of `freeText`

An Open/Closed toggle at the top of the queue switches between open and closed/escalated views. A refresh button (↻) manually re-fires the 15 s poll.

### Detail panel (right pane)

Slides in as a fixed overlay when a card is clicked. Clicking the backdrop or ×  closes it.

Header: case type as `<h1>`, sub-line with case ID (monospace) · time ago · lane badge.

#### Intake section (key-value table)

| Key | Value |
|-----|-------|
| Request type | Case type label |
| Red-flag screen | ✓ No red flags OR ⚠ tripped — excerpt |
| Missing (if set) | ⏳ description |
| Patient note | `freeText` |

#### Decision packet (all open cases)

Shown for every open case regardless of lane. Triggers `POST /api/case/[id]/packet` when the panel opens (gated: only fires if `c.packet` is null and `c.status === "open"`). Displays a spinner while generating; renders packet text as `<pre>` with `white-space: pre-wrap` (bullet lines from Gemini or mock). Controlled by `USE_AI` in `.env.local` — default is mock packets (no Gemini credits used).

#### Disposition — lane-specific

**needs-sync:** "Red flag tripped…cannot close async" explanation + disabled "Booked for live visit" ghost button.

**async-pending:** Blocking box ("Waiting on patient: …") + disabled "Close case · blocked" button + Escalate button.

**async-ready:**
1. Editable patient message textarea (pre-filled template per case type, shown once the packet is ready).
2. Clinician attestation input (pre-filled "Dr. A. Moreau, MD · #QC-88421", editable).
3. Action row:
   - **✓ Attest & close** — disabled until attestName is non-empty
   - **Close all N similar** — appears when ≥2 open cases share `cohortId`; shows inline confirmation listing IDs before committing (see issue 16)
   - **Escalate** — red danger button; requires confirmation step (see issue 14)

**Closed stamp:** "✓ Closed async — Dr. A. Moreau, MD"
**Escalated stamp:** "⚡ Escalated — routed to urgent live visit"

### Seed data (`makeSeed`)

Five demo cases pre-populated at page load (timestamps fresh each reload):

| ID | Type | Lane | cohortId |
|----|------|------|---------|
| c-d04e | med-renewal | needs-sync | null |
| c-2b91 | med-renewal | async-ready | cohort-med-renewal:async-ready |
| c-e5b2 | med-renewal | async-ready | cohort-med-renewal:async-ready |
| c-7f3a | lab-followup | async-pending | cohort-lab-followup:async-pending |
| c-a3f1 | med-renewal | async-pending | cohort-med-renewal:async-pending |

Seed cases don't exist server-side, so `POST /api/case/[id]/packet` returns 404 for them. The client falls back to `PACKETS` (local map for c-7f3a and c-2b91) or `PACKET_FALLBACK` for others.

### Poll / merge

Polls `GET /api/case` every 15 s. Merge logic: locally-closed and locally-escalated cases are preserved — the poll can't revert a provider action. Cases present only locally (seed or optimistic) are appended after the server list.

## Files created / modified

| File | Change |
|------|--------|
| `src/app/provider/layout.tsx` | Server component — Fraunces + IBM Plex Sans + IBM Plex Mono fonts; header with Dialogue wordmark |
| `src/app/provider/page.tsx` | Full interactive client component (all logic and UI) |
| `src/app/globals.css` | Design tokens + all provider CSS |

## Key decisions

- **Three lane columns** replace the original two-pane queue+detail concept, matching the actual visual reference (`image.png`).
- **Type grouping within columns** replaces cohort-cluster grouping from issue 15; type headers are more universally applicable and don't require cohortId.
- **Packet fetch gated on `status !== "open"` not lane** — so needs-sync cases also get a decision packet.
- **`key={selected.id}` on CaseDetail** forces remount on case switch, resetting all local form state automatically.
- **`useEffect` excludes `cases` from deps** (only depends on `selectedId`) — prevents an in-flight Gemini request from being cancelled every time the 15 s poll refreshes the case list.
- **Demo controls** (`simArrival`, `simLab`) exist in code but are commented out; can be re-enabled for the run-of-show.
