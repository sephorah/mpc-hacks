# Intake Classification

Classification runs in `src/pages/api/intake.ts` as a pure synchronous function — no AI, no network calls, no failure modes.

## Decision order

Three steps, evaluated in sequence:

### 1. Red-flag check → `needs-sync`

Scans the free-text for urgent keywords:

```
"chest pain", "chest tightness", "shortness of breath", "can't breathe",
"heart attack", "stroke", "severe", "emergency", "crushing", "fainting",
"unconscious", "bleeding heavily", "suicidal", "self-harm"
```

Any match → `needs-sync`. Routed to a live visit; the provider cannot close this case async. Evaluated before anything else; cannot be overridden.

### 2. Type classification

Three keyword lists checked in priority order (first match wins):

| Type | Keywords |
|------|----------|
| `med-renewal` | renew, renewal, refill, prescription, medication, inhaler, statin, pill |
| `lab-followup` | lab, blood test, blood work, results, bloodwork, test results, lab report |
| `chronic-condition-check-in` | check-in, checkup, check up, chronic, follow-up, followup, monitoring |
| `general-enquiry` | *(fallback — no match)* |

### 3. Missing-info check → `async-pending`

If no red flag was detected, the type is used to check whether required information is present:

| Type | `async-pending` if… | `missing` value |
|------|---------------------|-----------------|
| `lab-followup` | text does **not** signal result is attached (`"attached"`, `"uploaded"`, `"results are in"`, `"results show"`, `"i have my results"`, `"you can see"`, `"already in"`) | `"lab result"` |
| `med-renewal` | text signals pharmacy has changed (`"new pharmacy"`, `"changed pharmacy"`, `"different pharmacy"`, …) | `"pharmacy information"` |
| `chronic-condition-check-in` | text does **not** include recent measurements (`"my reading"`, `"blood pressure is"`, `"bp is"`, `"glucose is"`, `"a1c is"`, `"measured"`, `"tracking"`) | `"recent measurements"` |

If none of the above conditions match → `async-ready`.

## Lane summary

| Lane | Meaning | Provider can close async? |
|------|---------|--------------------------|
| `needs-sync` | Red flag — live visit required | No |
| `async-pending` | Missing info before provider can act | No (blocked) |
| `async-ready` | All info present, ready to review | Yes |

## AI role

Classification is intentionally AI-free. Gemini is only called later, when a provider opens the case, to generate the **decision packet** — a ≤150-word clinical summary the provider reads before attesting. AI summarises; it never decides.
