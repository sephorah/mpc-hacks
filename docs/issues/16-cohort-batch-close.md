# Issue 16 — Cohort Batch-Close

## What was built

When the selected case belongs to a cohort with ≥2 async-ready open cases, a "Close all N similar" button appears next to "Attest & close". Clicking shows an inline confirmation listing all cohort case IDs; confirming closes every eligible case at once and deselects.

## Files changed

- `src/app/provider/page.tsx` — `batchClose(ids)` function in `ProviderWorkspace`; `cohortReady` derived value; `cohortReady` + `onBatchClose` props added to `CaseDetail`; `showBatchConfirm` state + confirmation UI in `CaseDetail`
- `src/app/globals.css` — `.btn-batch`, `.batch-confirm`, `.batch-ids`

## Key decisions

- `cohortReady` filters to `status === "open" && lane === "async-ready"` — needs-sync cases in the same cohort are never batch-closed (safety rule preserved)
- Batch close button requires a non-empty `attestName` (same guard as single close)
- After batch close, `selectedId` is set to null — queue reflects the cleared cases immediately
