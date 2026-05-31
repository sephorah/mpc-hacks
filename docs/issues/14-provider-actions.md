# Issue 14 — Provider case actions

## What was built

**Escalate** added to the inline detail panel alongside Close. Request info was prototyped but removed from the final UI (function `requestInfo` exists in page.tsx but has no UI entry point).

### Escalate

Available on both `async-ready` and `async-pending` cases via a red **Escalate** button.

- **async-ready:** Escalate button sits inline in the `attest-row` alongside "Attest & close" and "Close all N similar".
- **async-pending:** Escalate button sits next to the disabled "Close case · blocked" button.

In both cases, clicking shows an inline confirmation step:

> "Escalating routes this case to an urgent live visit and removes it from the async queue."

Confirming calls `escalateCase(id)` which sets `status: "escalated"` and `escalatedAt: Date.now()` locally. The case disappears from the open queue (the `open` filter is `status === "open"`). The detail panel shows "⚡ Escalated — routed to urgent live visit".

### What was dropped vs. original spec

The original spec included a **Request info** action (text input → transition to async-pending + set `missing`). The function `requestInfo()` remains in `ProviderWorkspace` but there is no UI entry point — the button was removed to keep the action row clean. The close / batch-close / escalate row is the sole action surface.

The `ActionButtons` sub-component mentioned in early commits was also removed; all action UI is rendered inline in `CaseDetail`.

## Files modified

| File | Change |
|------|--------|
| `src/lib/types.ts` | Added `"escalated"` to `status` union; added `escalatedAt: number \| null` |
| `src/app/globals.css` | Added `.btn-danger` (red outline, hover fill) |
| `src/app/provider/page.tsx` | `escalateCase()` in `ProviderWorkspace`; escalate button + confirm inline in `CaseDetail`; poll merge extended to cover `"escalated"` status |

## Key decisions

- **`key={selected.id}` on CaseDetail** — forces React to remount on case switch; all local confirm states (`showEscalateConfirm`, `showBatchConfirm`) reset automatically.
- **Local state only** — escalate mutates local state optimistically; no API route wired yet (consistent with closeCase).
- **Poll merge extended** — `inactiveIds` covers both `"closed"` and `"escalated"` so polls can't revert either action.
- **`"escalated"` excluded from queue** — `open` filter (`status === "open"`) handles this; no special casing needed.
