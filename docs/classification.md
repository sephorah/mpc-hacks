# Intake Classification

Classification runs in `src/pages/api/intake.ts` as a pure synchronous function — no AI, no network calls, no failure modes.

## Two independent decisions

### 1. Lane (safety gate) — evaluated first

Scans the patient's free-text for red-flag keywords:

```
"chest pain", "chest tightness", "shortness of breath", "can't breathe",
"heart attack", "stroke", "severe", "emergency", "crushing", "fainting",
"unconscious", "bleeding heavily", "suicidal", "self-harm"
```

- Any match → `needs-sync`: routed to a live visit; the provider **cannot** close this case async.
- No match → `async-ready`: eligible for async closure.

This check runs before type classification and its result cannot be overridden downstream.

### 2. Case type — evaluated after lane

Three keyword lists checked in priority order (first match wins):

| Type | Keywords |
|------|----------|
| `med-renewal` | renew, renewal, refill, prescription, medication, inhaler, statin, pill |
| `lab-followup` | lab, blood test, results, bloodwork, test results, lab report |
| `chronic-condition-check-in` | check-in, checkup, check up, chronic, follow-up, followup, monitoring |
| `general-enquiry` | *(fallback — no match)* |

Lane and type are independent. A red-flagged renewal (`"chest pain"` + `"renew"`) produces `needs-sync` + `med-renewal`.

## AI role

Classification is intentionally AI-free. Gemini is only called later, when a provider opens the case, to generate the **decision packet** — a ≤150-word clinical summary the provider reads before attesting. AI summarises; it never decides.

## Current gap: `async-pending`

The `async-pending` lane (case is closeable async but something is missing — e.g. a lab result) is defined in the type system but never assigned at intake. Reaching it would require either:
- A structured question flow with explicit yes/no fields (e.g. "Have you attached your lab result?"), or
- A post-classification check that detects a lab-followup case with no attachment.

This is a known gap for the demo.
