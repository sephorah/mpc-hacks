# Issue 12 — Patient Cohorting

## What was built

Added `cohortId: string | null` to the `Case` type. Cases with identical `CaseType` and answer fingerprint share the same `cohortId`, allowing the provider UI to group and batch-act on similar presentations.

## Files changed

- `src/lib/types.ts` — added `cohortId` field to `Case`
- `src/app/provider/page.tsx` — seed data pre-populated: two med-renewal cases share `"cohort-med-renewal"`, lab-followup is a singleton (`null`); `simArrival` also assigns the med-renewal cohort so new arrivals join the cluster visibly during the demo

## Key decisions

- **No SQLite needed** — `cohortId` is just a string field on the in-memory case object; no schema migration required.
- **Fingerprint format** — `cohort-{type}` for the demo seed (empty answers → same fingerprint for same type). The full `type + sorted true-answer keys` fingerprint will be computed server-side in `POST /api/intake` (issue 3).
- **needs-sync cases can be in a cohort** — a red-flag case and an async-ready case of the same type can share a cohortId; the provider can still batch-close only the eligible ones (issue 16 will enforce this).
