# Issue 15 — Cohort Queue UI

## What was built (current state)

The provider queue is a three-column kanban board — one column per lane (NEEDS SYNC, ASYNC READY, ASYNC PENDING). Within each column, cases are grouped by case type under a tinted header pill.

### Type grouping (replaces cohort clusters)

The original spec called for cohort-based cluster grouping (visual clusters for cases sharing a `cohortId`). This was replaced with **type grouping within each lane column** — simpler, more general, and visually clearer.

Each column builds a `Map<CaseType, Case[]>` from its cases, then renders a `type-group-header` for each type present. The header shows the type label and a case count badge. The styling uses `color-mix(in srgb, var(--accent-soft) 60%, ...)` for a lane-tinted background.

`cohortId` is still tracked on cases and drives the **batch-close** button in the detail panel (issue 16) — it just no longer produces visual clusters in the queue.

### Open / Closed toggle (replaces "Ready only" filter)

The queue toggles between:
- **Open** — all `status === "open"` cases, grouped by type within each lane
- **Closed** — all `status !== "open"` cases (closed + escalated), sorted by `closedAt` descending

The "Ready only" toggle from early iterations was removed.

## Files changed

- `src/app/provider/page.tsx` — `laneColumns` derived from `displayed` cases; `showClosed` state replaces `readyOnly`; `QueueCard` extracted as a named component
- `src/app/globals.css` — `.type-group`, `.type-group-header`, `.type-group-count`, `.queue-col`, `.queue-col-head`, `.btn-filter`, `.queues-toggle`

## Key decisions

- Type grouping is universal — every case has a type, so every lane column always has grouping regardless of cohort membership.
- Closed view uses the same three-column layout so providers can review what they've actioned.
- `laneColumns` is memoized on `displayed` (which switches on `showClosed`); switching tabs re-derives instantly without a poll.
