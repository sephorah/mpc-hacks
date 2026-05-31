# Issue 13 — Provider dashboard `/provider`

## What was built

Queue + detail two-pane provider workspace, matching `provider-workspace-mock.html`.

**Left pane** — "Open cases" queue listing all open cases, newest first. Each card shows case type, ID, time in queue, lane badge, and a "missing: …" note for `async-pending` cases. Clicking a card selects it (teal active border).

**Right pane** — Case detail with:
- Intake panel (request type, red-flag screen result, patient note)
- Lane-specific disposition:
  - `needs-sync` → cannot close async; "Booked for live visit" ghost button
  - `async-pending` → AI decision packet (spinner → text) + blocking box + disabled close
  - `async-ready` → AI decision packet + clinician attestation checkbox + "Attest & close"
- Closed state: "✓ Closed async — Dr. A. Moreau, MD"

**Demo controls** (bottom-right): `+ patient submits` and `patient sends lab` for the demo run-of-show.

## Files created / modified

| File | Change |
|------|--------|
| `src/app/provider/layout.tsx` | Server component — loads Fraunces, IBM Plex Sans, IBM Plex Mono; renders header |
| `src/app/provider/page.tsx` | Client component — full interactive workspace |
| `src/app/globals.css` | Design tokens + all `.provider-workspace` CSS (ported from mock) |

## Key decisions

- **Seed data**: `makeSeed()` called via `useMemo` at mount time so timestamps are fresh on each page load, not frozen at module-load time.
- **Poll merge**: When `GET /api/cases` responds, locally-closed cases are preserved in the merge — the poll won't revert a provider's close action before issue 7's API is built.
- **Lane guard**: `closeCase()` enforces `needs-sync → cannot close` at the function level, not just via disabled UI button.
- **No `casesRef`**: Removed the anti-pattern of mutating a ref during render; the packet generation effect reads `cases` directly via its dependency array.
- Polls every **15 s**; seed replaced by real API data on first successful `GET /api/cases` (issues 1–4).
