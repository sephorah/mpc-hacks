# Issue 14 — Provider case actions

## What was built

Added **Request info** and **Escalate** buttons to the inline detail panel alongside the existing Close action.

**Request info** — inline text input asking what the patient needs to provide. On submit: case transitions to `async-pending`, `missing` is set to the message, and the existing AI packet is cleared so a fresh one can generate when the patient responds.

**Escalate** — inline confirmation step before committing. On confirm: case status becomes `"escalated"`, disappears from the open queue, and the detail panel shows "⚡ Escalated — routed to urgent live visit". This is the visible safety guardrail for the demo.

Both buttons appear **side by side** below the primary action (Close/blocked close) for both `async-ready` and `async-pending` cases. When one expands to its form/confirm, the other hides until the interaction is resolved.

## Files modified

| File | Change |
|------|--------|
| `src/lib/types.ts` | Added `"escalated"` to `status` union; added `escalatedAt: number \| null` |
| `src/app/globals.css` | Added `.btn-danger` (red outline, hover fill) |
| `src/app/provider/page.tsx` | Added `requestInfo()` and `escalateCase()` state functions; new `ActionButtons` sub-component; updated `CaseDetail` props and render |

## Key decisions

- **Local state only** — both actions mutate local state, consistent with `closeCase`. API wiring deferred to when the backend (issues 1–7) lands.
- **`key={selected.id}` on CaseDetail** — forces React to remount the component on case switch, automatically resetting all local form state (showRequestForm, requestMsg, showEscalateConfirm). Cleaner than manually resetting in `select()`.
- **`requestInfo` clears `packet: null`** — prevents stale AI decision packet from showing while the case waits for new patient info.
- **Poll merge extended** — `inactiveIds` set now covers both `"closed"` and `"escalated"` statuses, so a poll can't revert either action.
- **`"escalated"` cases auto-excluded from queue** — the `open` filter is `status === "open"`, so escalated cases disappear without any special handling.
