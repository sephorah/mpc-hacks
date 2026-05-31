# Issue 15 — Cohort Queue UI

## What was built

Cases sharing a `cohortId` are grouped into cluster cards in the provider queue. A "Ready only" toggle filters the queue to async-ready cases.

## Files changed

- `src/app/provider/page.tsx` — `QueueCard` component extracted; `readyOnly` state; cluster grouping logic (cohortMap → clusters + singletons); queue renders clusters first then singletons
- `src/app/globals.css` — `.cluster`, `.cluster-header`, `.cluster-count`, `.cluster-type`, `.cohort-badge`, `.btn-filter`, `.queue-filters`

## Key decisions

- Clusters only form when ≥2 displayed cases share a `cohortId`; single-case cohorts render as singletons
- "Ready only" toggle filters before clustering, so cohorts with no async-ready cases disappear cleanly
- Cards inside a cluster lose their outer margin/border-radius and gain a bottom separator — visually unified without custom card variants
