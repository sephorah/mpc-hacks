# AI Usage

Gemini is used in exactly one place: generating the **decision packet** after a provider opens a case.

## Where AI is used

### Decision packet — `POST /api/case/[id]/packet`

Implemented in `src/gemini.ts` (`generatePacket`) and served by `src/pages/api/case/[id]/packet.ts`.

When a provider selects an `async-ready` or `async-pending` case, the frontend fires this endpoint. Gemini reads three fields from the case:

- `freeText` — the patient's intake submission
- `type` — case type (med-renewal, lab-followup, etc.)
- `lane` — current routing lane
- `redFlags` — whether a red flag was detected at intake

It returns a ≤150-word clinical packet covering:
1. Chief complaint
2. Suggested action
3. Flag level (green / yellow / red)

The packet is stored in `caseObj.packet` on first generation. Subsequent loads return the cached value without calling Gemini again.

**Fallback:** if Gemini fails or times out, a hardcoded string is stored instead — `"Decision packet unavailable. Please review the patient's intake notes directly before acting."` — so the provider always sees something actionable.

## Where AI is not used

| Step | Mechanism |
|------|-----------|
| Intake classification (lane + type) | Deterministic keyword rules — see `docs/classification.md` |
| Close / escalate decisions | Provider only — no AI involvement |
| Patient-facing messages | Hardcoded templates per case type |

## Design rationale

Keeping AI out of classification means the routing decision is auditable, instant, and never blocked by API availability or quota. Gemini only touches the summarisation step, where a wrong or missing output degrades the provider experience but does not affect patient safety or case routing.

This satisfies the challenge's hard constraint: licensed practitioners own all regulated clinical decisions; AI prepares context, never decides.

## Model

`gemini-2.0-flash` with streaming (`generateContentStream`). Called from the Node.js custom server, not from a browser.
