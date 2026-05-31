# App overview — MPC Hacks 2026

Stack: Next.js 16 · TypeScript · Tailwind v4 · Biome · custom Node server (`src/server.ts`) · in-memory store (no DB).

`npm run dev` — starts the server.

---

## Patient app `/patient`

Four-step intake wizard.

| Step | What happens |
|------|-------------|
| **Type** | Pick one of 4 case types. `general-enquiry` requires a physical/mental subtype. |
| **Safety** | 3 red-flag yes/no questions (type-specific). Any "yes" → `needs-sync`. Warning shown inline. |
| **Readiness** | Completeness check for med-renewal, lab-followup, chronic check-in. "No" → `async-pending` + `missing` set. Skipped for general-enquiry. |
| **Details** | Free-text note (280 char cap). Optional. |

On submit → `POST /api/intake` → success screen shows lane message + short case ID.

**Lane messages shown to patient:**

| Lane | Title | Body |
|------|-------|------|
| async-ready | Request received | Provider will respond, no appointment needed. |
| async-pending | Request received — one more thing | Team will follow up for missing info. |
| needs-sync | A provider will contact you | Flagged for live consultation. |

---

## Provider app `/provider`

### Stats bar
- **Sync slots freed today** — `7 + asyncClosed` (increments live as async cases are closed)
- **Cases / clinician-hour** — static `11.2`

### Queue — three lane columns

`NEEDS SYNC → ASYNC READY → ASYNC PENDING`

Within each column, cards grouped by case type under a tinted header pill. Each card shows: type · short ID · time ago (row 1), lane badge · preview (row 2).

Open/Closed toggle switches between open and closed+escalated views. ↻ button manually re-polls.

### Detail panel

Opens as a slide-in overlay. Contains:

1. **Header** — case type, case ID, time ago, lane badge
2. **Intake** — key-value table: request type, red-flag screen result, missing (if set), patient note
3. **Decision summary** — AI-generated 3-bullet brief (spinner while loading). Shown for all open cases. Controlled by `USE_AI` in `.env.local` (default `false` → mock, no Gemini credits).
4. **Disposition** — lane-specific:

| Lane | Disposition |
|------|------------|
| needs-sync | Cannot close async — "Booked for live visit" ghost button |
| async-pending | Blocking box + disabled close + **Escalate** |
| async-ready | Editable patient message + attestation input + **Attest & close** + **Close all N similar** (if cohort ≥2) + **Escalate** |
| closed | ✓ Closed async stamp |
| escalated | ⚡ Escalated stamp |

**Escalate** requires inline confirmation before committing. Sets `status: "escalated"`, removes case from open queue.

**Batch close** — appears when ≥2 open cases share `cohortId`. Confirmation lists all case IDs before closing.

### Seed data (5 cases, fresh timestamps each reload)

| ID | Type | Lane |
|----|------|------|
| c-d04e | med-renewal | needs-sync |
| c-2b91 | med-renewal | async-ready |
| c-e5b2 | med-renewal | async-ready |
| c-7f3a | lab-followup | async-pending |
| c-a3f1 | med-renewal | async-pending |

c-2b91 and c-e5b2 share `cohortId` → "Close all 2 similar" appears.

Poll interval: 2.5 s.

---

## API routes

| Method | Route | What it does |
|--------|-------|-------------|
| POST | `/api/intake` | Validate payload, classify → lane, insert into store, return `{ caseId, lane }` |
| GET | `/api/case` | All cases from store |
| GET | `/api/case/[id]` | Single case |
| POST | `/api/case/[id]/packet` | Generate AI decision summary (or mock). Writes to `case.packet`. |
| POST | `/api/case/[id]/close` | Set `status: closed`, `closedAt: now` |
| POST | `/api/init_patient` | Initialize a patient session |

---

## AI — `src/gemini.ts`

- Model: **Gemini 2.5 Flash**
- 3-bullet prompt per case type (med-renewal, lab-followup, chronic check-in, general-enquiry)
- Prompt rule: summarise intake only — no clinical decisions, no routing, no flags
- Deterministic `fallbackSummary()` returned on any error (no API key, quota, timeout)
- `USE_AI=true` in `.env.local` to enable; default is `false` (mock packets, 600 ms delay)

---

## Data model — `Case`

```ts
{
  id: string
  type: "med-renewal" | "lab-followup" | "chronic-condition-check-in" | "general-enquiry"
  lane: "needs-sync" | "async-ready" | "async-pending"
  status: "open" | "closed" | "escalated"
  redFlags: boolean
  missing: string | null
  freeText: string
  packet: string | null        // AI decision summary text
  cohortId: string | null      // shared key for same-type same-lane cases
  createdAt: number
  closedAt: number | null
  escalatedAt: number | null
}
```

Store: module-level `Map<string, Case>` in `src/state.ts`. Resets on server restart.

---

## What's not built

- `/` root page — still the default Next.js placeholder
- Patient status page `/cases/[id]`
- Run-of-show script (issue 17)
- Safety audit (issue 18)
- Layout `<title>` / metadata (issue 20)
