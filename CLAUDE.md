# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is a hackathon project for **MPC Hacks 2026** (Polytechnique Montréal, May 30–31, 2026). The app is **fully scaffolded and running** — both patient and provider surfaces are built.

### Commands

```bash
npm run dev      # start dev server (uses src/server.ts, not next dev)
npm run lint     # Biome check
npm run format   # Biome format --write
npm run build    # Next.js production build
```

### Route map

| Route | Surface | Notes |
|-------|---------|-------|
| `/` | Root | App entry |
| `/patient` | Patient | Landing + intake flow |
| `/provider` | Provider | Kanban queue + case detail panel |
| `GET /api/case` | API | All cases (open by default) |
| `GET /api/case/[id]` | API | Single case |
| `POST /api/intake` | API | Patient submits; classify → insert → return |
| `POST /api/case/[id]/packet` | API | Trigger AI decision packet (or mock) |
| `POST /api/case/[id]/close` | API | Provider closes case |
| `POST /api/init_patient` | API | Initialize a patient session |

### Key source files

- `src/state.ts` — in-memory `Map<string, Case>` store (no DB; resets on restart)
- `src/gemini.ts` — Gemini 2.5 Flash integration + deterministic fallback
- `src/lib/types.ts` — shared `Case`, `CaseType`, `Lane` types
- `.env.local` — `GEMINI_API_KEY` + `USE_AI` flag (default `false` → mock packets)

## The challenge being built

The team is taking on **Dialogue's "Zero Wait Time Virtual Care"** challenge (`docs/Dialogue - MPC Hacks Challenge.pdf`). Read that brief before designing anything — the constraints below shape every architectural choice.

**Deliverable:** two working apps — one for **patients**, one for **care providers** — that together get members care with near-zero wait time while keeping clinicians in charge of regulated decisions.

### Non-negotiables (hard constraints — do not design around them)

1. **Licensed practitioners must own all regulated clinical decisions** — prescriptions, attestations, diagnoses. AI/automation can prepare and present, never decide.
2. **Resolution, not routing.** Symptom collection alone is not a solution. Every patient flow must close the loop to an outcome.
3. **Safety guardrails and escalation paths are designed in, not bolted on.** Any feature that touches care must specify its escalation path from day one.

### Where the design leverage lives

The brief explicitly calls out these opportunity areas — favor solutions that hit one or more:

- **Batching & pre-digestion** — AI assembles a clinical decision packet so a clinician acts in minutes, not half-hours.
- **Patient cohorting** — one clinical decision safely applied across many similar presentations.
- **Async care workflows** — replace 1:1 real-time consults with structured async paths where appropriate.
- **Eliminating low-value work** — anything consuming clinician time without deep medical judgment is a target.

When proposing a feature, frame it against the brief's three submission questions:
1. How does this keep wait times low as patients scale while providers stay constant?
2. Which low-provider-time service does it deliver (med renewals, lab follow-ups, chronic check-ins, etc.)?
3. How does it help one clinician care for hundreds or thousands of patients daily?

## Submission deadline

**Devpost submission closes Sunday, May 31st 2026, 12:00 PM (Noon) Montreal time (UTC-5).** Scope every suggestion against the remaining time. The public GitHub repo must be linked from the Devpost submission.

## Issue implementation workflow

Follow this sequence for **every backlog issue**:

1. **Plan** — use `/plan` (EnterPlanMode) to write an implementation plan. Wait for user approval before touching any code.
2. **Implement** — build the feature. Verify it works in the browser before declaring done.
3. **Code review** — run `/code-review` on the diff. Fix all confirmed/plausible findings before finishing.
4. **Issue summary** — write `docs/issues/<number>-<slug>.md` summarising what was built, files changed, and key decisions.
5. **Commit** — stage and commit (do not push unless the user says so).

## Doc references

- `docs/Dialogue - MPC Hacks Challenge.pdf` — Dialogue challenge brief (source of truth for the build).
- `docs/Hacker_Manual.md` — event logistics, rules, and the list of MLH sponsor tracks (Gemini, ElevenLabs, Solana, Vultr, MongoDB Atlas, .Tech) that the project may additionally target.
