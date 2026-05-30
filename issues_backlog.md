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

| #  | Title | Priority | Size | Owner | Done |
|----|-------|----------|------|-------|------|
| 1  | SQLite schema + db helper (`src/lib/db.ts`) — `cases` table mirroring the `Case` type; expose `insertCase`, `getCase`, `listOpenCases`, `updateCase`; seed a few realistic cases so the provider UI has data from minute one | P0 | M | Walid | |
| 2  | Rule layer (`src/lib/classify.ts`) — pure `(type, answers) → Lane` function; red-flag keys → `needs-sync`; missing required field → `async-pending`; else `async-ready` | P0 | S | Walid | |
| 3  | `POST /api/intake` — validate payload, call classify, persist to SQLite, fire-and-forget packet trigger for `async-ready` cases, return case | P0 | M | Walid | |
| 4  | `GET /api/cases` — open cases from SQLite ordered by `createdAt` desc | P0 | S | Walid | |
| 5  | `GET /api/cases/[id]` — fetch one case by id from SQLite | P0 | S | Walid | |
| 6  | `POST /api/cases/[id]/packet` — call LLM with answers + freeText; write structured packet (chief complaint, suggested action, flag level, ≤150 words); **hardcoded fallback packet if LLM fails or times out** | P0 | M | Walid | |
| 7  | `POST /api/cases/[id]/close` — set `status: closed`, `closedAt: now()` in SQLite; reject (400) if lane is `needs-sync` | P0 | S | Walid | |
| 8  | Define intake questions per `CaseType` in `src/lib/questions.ts` — yes/no checklist keys, which are red-flag, which are required | P0 | S | Walid | |
| 9  | Landing page `/` — three cards: Medication Renewal, Lab Follow-up, Chronic Condition Check-in; each routes to `/intake/[type]` | P1 | S | Walid | |
| 10 | Intake form `/intake/[type]` — renders questions from `questions.ts`, free-text box, red-flag hard stop inline, submits to `POST /api/intake`, redirects to `/cases/[id]` | P1 | M | Walid | |
| 11 | Patient status page `/cases/[id]` — polls `GET /api/cases/[id]` every 10 s; lane-appropriate message; updates when `status` flips to `closed` | P1 | M | Walid | |
| 12 | Patient cohorting — fingerprint answers by `CaseType` on intake; tag matching open cases with shared `cohortId` (add column to SQLite schema) | P2 | M | Walid | |
| 13 | Provider dashboard `/provider` — three-column layout (one per lane); case cards with `CaseType`, time in queue, `missing` badge if `async-pending`; polls `GET /api/cases` every 15 s | P3 | M | Séphorah | |
| 14 | Provider case detail `/provider/cases/[id]` — AI packet display (skeleton while `packet === null`); three actions: **Close** (only for `async-ready`), **Request info**, **Escalate**; calls the appropriate route on each | P3 | M | Séphorah | |
| 15 | Cohort batch-close — "Close all [N] similar cases" button when `cohortId` present; confirmation dialog; calls `POST /close` for each | P3 | L | Séphorah | |
| 16 | Run-of-show script — step-by-step demo flow: patient submits → provider queue updates → packet loads → provider closes; note which mock data to pre-seed | P4 | S | Séphorah | |
| 17 | Safety audit — `needs-sync` cases cannot be closed async; provider must act on every case; escalation copy is unambiguous on both sides | P4 | S | Séphorah | |
| 18 | Update `CLAUDE.md` — commands (`npm run dev`, `npm run lint`) + route map | P4 | S | Walid | |
| 19 | Replace default layout metadata in `src/app/layout.tsx` before demo | P4 | XS | Walid | |

---

## Deferred

- **ElevenLabs** voice intake — patient speaks symptoms instead of typing.
- **Auth / provider login** — not needed for demo; hardcode a single provider session.
- Push notifications when a case changes lane.
