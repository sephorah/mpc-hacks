# Issues Backlog

Stack: Next.js 16 · TypeScript · Tailwind v4 · Biome · custom Node server (`src/server.ts`) · **in-memory store** for demo persistence (SQLite dropped — no time).

Two surfaces to ship: **Patient app** (`/`) · **Provider app** (`/provider`).

API surface:
- `POST /api/intake` — patient submits; lane classification runs here server-side. Returns the created case.
- `GET /api/cases` — provider queue polls this. Returns all open cases, newest first.
- `GET /api/cases/[id]` — fetch one case by id.
- `POST /api/cases/[id]/packet` — the one live LLM call. **Fallback is mandatory.**
- `POST /api/cases/[id]/close` — provider approves and closes the case.

All API routes use a module-level `Map<string, Case>` as the store — no database, data resets on server restart, sufficient for demo.

---

| #  | Title | Priority | Size | Owner | Done |
|----|-------|----------|------|-------|------|
| ~~1~~  | ~~SQLite schema + db helper~~ — dropped, replaced by in-memory store in `src/lib/store.ts` | P0 | S | Walid | |
| 2  | Rule layer (`src/lib/classify.ts`) — pure `(type, answers) → Lane` function; red-flag keys → `needs-sync`; missing required field → `async-pending`; else `async-ready` | P0 | S | Walid | |
| 3  | `POST /api/intake` — validate payload, call classify, insert into in-memory store, fire-and-forget packet trigger for `async-ready` cases, return case | P0 | M | Walid | |
| 4  | `GET /api/cases` — open cases from in-memory store ordered by `createdAt` desc | P0 | S | Walid | |
| 5  | `GET /api/cases/[id]` — fetch one case by id from in-memory store | P0 | S | Walid | |
| 6  | `POST /api/cases/[id]/packet` — call LLM with answers + freeText; write structured packet (chief complaint, suggested action, flag level, ≤150 words); **hardcoded fallback packet if LLM fails or times out** | P0 | M | Walid | |
| 7  | `POST /api/cases/[id]/close` — set `status: closed`, `closedAt: now()` in in-memory store; reject (400) if lane is `needs-sync` | P0 | S | Walid | |
| 8  | Define intake questions per `CaseType` in `src/lib/questions.ts` — yes/no checklist keys, which are red-flag, which are required | P0 | S | Walid | |
| 9  | Landing page `/` — three cards: Medication Renewal, Lab Follow-up, Chronic Condition Check-in; each routes to `/intake/[type]` | P1 | S | Walid | |
| 10 | Intake form `/intake/[type]` — renders questions from `questions.ts`, free-text box, red-flag hard stop inline, submits to `POST /api/intake`, redirects to `/cases/[id]` | P1 | M | Walid | |
| 11 | Patient status page `/cases/[id]` — polls `GET /api/cases/[id]` every 10 s; lane-appropriate message; updates when `status` flips to `closed` | P1 | M | Walid | |
| 12 | Patient cohorting — add `cohortId: string \| null` to `Case` type; compute fingerprint (`type + sorted true-answer keys`) at intake; tag matching open cases with shared `cohortId`; seed data pre-populated with two med-renewal cases sharing a cohortId | P2 | M | Walid | X |
| 13 | Provider workspace `/provider` — two-pane layout: left queue (all open cases, lane badge, time, `missing` note) + right detail panel (intake table, AI decision packet with spinner, lane-aware disposition: `needs-sync` → booked live visit; `async-pending` → blocked close; `async-ready` → clinician attestation + close). Seed data for demo; polls `GET /api/cases` every 15 s with local-close merge. Also covers the inline detail view from issue 14 (packet display + close action); issue 14 remains open for the separate `/provider/cases/[id]` route and Request info / Escalate actions. | P3 | M | Séphorah | X |
| 14 | Provider case actions — add **Request info** and **Escalate** buttons to the inline detail panel (already has Close); wire all three to their API routes (`POST /api/cases/[id]/close`, request-info, escalate); Escalate is the visible safety guardrail for the demo | P3 | S | Séphorah | X |
| 15 | Cohort queue UI — in the provider queue, group cards sharing a `cohortId` under a collapsible cluster header ("N similar · med-renewal") with a distinct background tint; show a "N similar" badge on each card; queue still sorted by `createdAt` within each cluster | P3 | M | Séphorah | |
| 16 | Cohort batch-close — "Close all [N] similar cases" button in the detail panel when `cohortId` present; confirmation dialog listing the case IDs; calls close logic for each | P3 | M | Séphorah | |
| 17 | Run-of-show script — step-by-step demo flow: patient submits → provider queue updates → packet loads → provider closes; note which mock data to pre-seed | P4 | S | Séphorah | |
| 18 | Safety audit — `needs-sync` cases cannot be closed async; provider must act on every case; escalation copy is unambiguous on both sides | P4 | S | Séphorah | |
| 19 | Update `CLAUDE.md` — commands (`npm run dev`, `npm run lint`) + route map | P4 | S | Walid | |
| 20 | Replace default layout metadata in `src/app/layout.tsx` before demo | P4 | XS | Walid | |

---

## Deferred

- **ElevenLabs** voice intake — patient speaks symptoms instead of typing.
- **Auth / provider login** — not needed for demo; hardcode a single provider session.
- Push notifications when a case changes lane.
- **SQLite persistence** — dropped for demo; in-memory store sufficient.
