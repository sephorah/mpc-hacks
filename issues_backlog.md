# Issues Backlog

Stack: Next.js 16 · TypeScript · Tailwind v4 · Biome · custom Node server (`src/server.ts`) · **SQLite** (via `better-sqlite3`) for persistence.

Two surfaces to ship: **Patient app** (`/`) · **Provider app** (`/provider`).

API surface:
- `POST /api/intake` — patient submits; lane classification runs here server-side. Returns the created case.
- `GET /api/cases` — provider queue polls this. Returns all open cases, newest first.
- `GET /api/cases/[id]` — fetch one case by id.
- `POST /api/cases/[id]/packet` — the one live LLM call. **Fallback is mandatory.**
- `POST /api/cases/[id]/close` — provider approves and closes the case.

---

| #  | Title | Priority | Size | Done |
|----|-------|----------|------|------|
| 1  | Set up SQLite schema and db helper (`src/lib/db.ts`) — `cases` table mirroring the `Case` type; expose `insertCase`, `getCase`, `listOpenCases`, `updateCase` | P0 | M | |
| 2  | `POST /api/intake` — validate payload, run lane classification (red-flag → `needs-sync`; missing required field → `async-pending`; else `async-ready`), persist to SQLite, return case | P0 | M | |
| 3  | `GET /api/cases` — query SQLite for all open cases ordered by `createdAt` desc | P0 | S | |
| 4  | `GET /api/cases/[id]` — fetch one case by id from SQLite | P0 | S | |
| 5  | `POST /api/cases/[id]/packet` — call LLM with answers + freeText; write structured packet (chief complaint, suggested action, flag level, ≤150 words) to `Case.packet`; **hardcoded fallback packet if LLM fails or times out** | P0 | M | |
| 6  | `POST /api/cases/[id]/close` — set `status: closed`, `closedAt: now()` in SQLite; reject if case is `needs-sync` | P0 | S | |
| 7  | Define intake questions per `CaseType` in `src/lib/questions.ts` — yes/no checklist keys + which keys are red flags + which keys are required | P0 | S | |
| 8  | Replace boilerplate `page.tsx` — landing page with three cards: Medication Renewal, Lab Follow-up, Chronic Condition Check-in; each routes to `/intake/[type]` | P1 | S | |
| 9  | Intake form `/intake/[type]` — renders questions from `questions.ts`, free-text box, submits to `POST /api/intake`, redirects to `/cases/[id]` on success | P1 | M | |
| 10 | Red-flag hard stop in intake form — on a flagged yes/no answer, stop the form immediately, show escalation message inline, submit partial case with `lane: needs-sync` | P1 | S | |
| 11 | Patient status page `/cases/[id]` — polls `GET /api/cases/[id]` every 10 s; shows lane-appropriate message; updates when `status` flips to `closed` | P1 | M | |
| 12 | Trigger `POST /api/cases/[id]/packet` automatically after intake for `async-ready` cases (fire-and-forget from the intake API route) | P2 | S | |
| 13 | Patient cohorting — on intake, fingerprint answers by `CaseType`; tag matching open cases with a shared `cohortId` (add column to SQLite schema) | P2 | M | |
| 14 | Provider dashboard `/provider` — three-column layout (one per lane); case cards show `CaseType`, time in queue, `missing` if `async-pending`; auto-refresh every 15 s | P3 | M | |
| 15 | Provider case detail `/provider/cases/[id]` — shows AI packet (skeleton while `packet === null`); three actions: **Close** (`POST /close`, only for `async-ready`), **Request info** (sets `lane: async-pending` + `missing`), **Escalate** (sets `lane: needs-sync`) | P3 | M | |
| 16 | Cohort batch-close — if case has `cohortId`, show "Close all [N] similar cases" with confirmation dialog; calls `POST /close` for each in the cohort | P3 | L | |
| 17 | Safety audit — verify: `needs-sync` cases cannot be closed async; provider action required on every case; escalation copy is unambiguous on both sides | P4 | S | |
| 18 | Update `CLAUDE.md` — add commands (`npm run dev`, `npm run lint`) and route map once stack is stable | P4 | S | |
| 19 | Replace default layout metadata in `src/app/layout.tsx` before demo | P4 | XS | |

---

## Deferred

- **ElevenLabs** voice intake — patient speaks symptoms instead of typing.
- **Auth / provider login** — not needed for demo; hardcode a single provider session.
- Push notifications when a case changes lane.
