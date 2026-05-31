# RECONCILED_PLAN.md
## Technical Implementation & Safety Reconciliation Blueprint
### Project: Zero-Wait Virtual Care System (Dialogue Challenge)

This file serves as the consolidated, technically reconciled roadmap for the development team. It merges the core architecture requirements with your teammate's task list, corrects critical clinical safety models, and flags the synchronous scheduling workflow as the **lowest priority / deferred tier**.

---

## 1. Technical Status (What is Completed)
The project boilerplate and tooling pipelines are fully initialized, but contain zero application logic:
* **Framework Core:** Next.js 16 and React 19 App Router skeleton are operational (`package.json`, `tsconfig.json`).
* **Custom HTTP Server:** Custom Node.js runtime environment configured in `src/server.ts`.
* **State Shell:** An empty container class is initialized at `src/state.ts` as a global singleton.
* **Styling & Linting:** Tailwind CSS v4 is configured in `src/app/globals.css` and Biome toolchains are ready in `biome.json`.

---

## 2. The Core Safety & Architectural Model
To satisfy Dialogue's hard constraints, the application uses a **Dual-Layer Deterministic Safety Framework** where AI never evaluates risk, never communicates directly with patients, and never proposes clinical choices.
[ Patient Intake Form ]
│
▼
┌────────────────────────────────────────────────────────┐
│ SAFETY LAYER 1: Deterministic Red-Flag Exclusion       │──► [Route to Sync Queue]
└────────────────────────────────────────────────────────┘
│ (Passes validation)
▼
┌────────────────────────────────────────────────────────┐
│ AI ASSEMBLY LAYER: Packet Compiling & Text Summary     │ (No diagnosis or draft generation)
└────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ COHORTING ENGINE: Strict Structural Grouping           │ (Type + Condition/Medication)
└────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ SAFETY LAYER 2: Deterministic Soft-Flag Outlier Pull   │──► [Isolate Case to Individual Queue]
└────────────────────────────────────────────────────────┘
│ (Clean Cohort Group)
▼
┌────────────────────────────────────────────────────────┐
│ PROVIDER INTERFACE: Logged Individual Attestations     │ (Batch review layout)
└────────────────────────────────────────────────────────┘
│
▼
[ Patient Private Thread Updates ]

---

## 3. High-Priority Technical To-Do List

### Module A: Core Data Engine & Dictionaries (`src/state.ts`)
Implement the backend in-memory storage, tracking schemas, and cohort grouping mechanics.
* **Type Schemas:**
  * `MedicalServiceType`: Enum (`RENEWAL`, `LAB_FOLLOW_UP`, `CHRONIC_CHECK_IN`).
  * `CaseStatus`: Enum (`INTAKE_PENDING`, `COHORT_READY`, `OUTLIER_ISOLATED`, `RESOLVED`, `ESC_SYNCHRONOUS`).
  * `PatientCase`: Object compiling metadata, structured field responses, AI summary context, triggered safety indicators, and unique identifier keys.
  * `CohortGroup`: Object linking a specific `ServiceType` + `ConditionKey` (or medication name) to an array of matching `caseIds`.
  * `Message`: Timeline tracking elements for private user threads (system logs, clinic alerts, official signed PDF documents).
* **State Memory Stores:**
  * `private cases: Map<string, PatientCase>`
  * `private cohorts: Map<string, CohortGroup>`
  * `private threads: Map<string, Message[]>`
* **Core Clustering Logic:** Write a functional sorting method that evaluates clean incoming cases and matches them into cohorts based on absolute structural equality of variables (e.g., `Service: Renewal` + `Medication: Synthroid`), ensuring it triggers the Layer 2 outlier scan automatically.
* **State Modification Hooks:**
  * `submitCase(data: IngestPayload): PatientCase`
  * `attestCase(caseId: string, doctorId: string, notes: string): void`
  * `escalateCase(caseId: string, reason: string): void`

### Module B: Patient Intake View (`src/app/patient/`)
Construct the client-facing side of the application focusing on data collection and hardcoded safeguards.
* **Structured Input Matrices:** Form steps specialized for **Medication Renewals** and **Lab Follow-ups**. Questions must use discrete inputs (dropdowns, checkmarks, sliders for stable biometric metrics) alongside a single free-text commentary field.
* **Layer 1 Hardcoded Validation Engine:** Integrate a strict client/server code validation layer checking input states. If any red flag is tripped (e.g., `hasShortnessOfBreath === true` or `systolicBloodPressure > 180`), completely bypass the asynchronous flow, set status to `ESC_SYNCHRONOUS`, and cleanly redirect the client to the Synchronous Availability workflow.
* **Secure Timeline Thread View (`src/app/patient/thread/[id]/page.tsx`):** A private dashboard where the patient reads automated status transitions and views their finalized prescription forms or clinic summaries once a doctor securely completes an attestation.

### Module C: AI Context Compilation (`src/app/api/process-case/`)
Integrate Google Gemini API bindings strictly constrained to data synthesis.
* **SDK Gateway:** Setup an API route loading the Gemini SDK.
* **System Prompt Constraint Lock:** Enforce strict prompt engineering instructions:
  ```text
  You are an automated medical transcriber. Your ONLY role is to read the patient's unstructured free-text commentary and summarize it in under 15 words. 
  CRITICAL: You must NEVER diagnose the patient, NEVER suggest medications, NEVER evaluate clinical risk, and NEVER generate outbound message content to the patient. Extract raw text summaries only.

* Payload Packet Assembler: Take the completed AI free-text summary, bind it alongside the structured form metrics and Layer 1 safety logs, and compile the final clinical packet inside src/state.ts.

### Module D: Care Provider Portal (src/app/provider/)
Build a high-density dashboard enabling rapid, safe batch review patterns.
* Build a high-density dashboard enabling rapid, safe batch review patterns.
    * Proposed Cohorts Feed: Lists clustered blocks of identical cases showing core commonality variables, total case volumes, and queue duration metrics.
    * Individual Exception Handling Feed: Houses isolated standalone workflows for cases kicked out by Layer 1 bypasses or Layer 2 soft flags.

* Layer 2 Outlier Visual Pull Engine: Implement a functional component that visibly demonstrates a case being extracted from a cohort when expanded. If a case contains a subtle discrepancy (e.g., a patient requesting a dosage alteration from 50mcg to 75mcg), the system must flag it, append a warning label, and strip it from the batch-review view into the individual high-touch column.

* Logged Attestation Click Matrix: Ensure that approving a cohort triggers a sequential visual loop requiring the provider to individualize sign-offs. This updates each independent case state with a distinct cryptographic/database timestamp record rather than executing a single blind bulk action.

### Synchronous Scheduling Feature Set (LAST PRIORITY / DEFERRED)
Per design priorities, this feature set will only be built after the asynchronous engine and safety layers are fully functional:
* Time Windows Field Ingestion: Add an optional preferredSyncWindows tracking array to the PatientCase schema allowing patients routed to the SYNC track to indicate upcoming availability slots.
* Instant Consult Call Modifier: Write a backend state function triggerSyncAlert(caseId: string) that updates the patient case status to an active countdown mode.
* 1-Hour Alert Dispatch Simulator: Create a UI simulation component on the patient thread view that registers a live alert event (e.g., "Your Care Coordinator has scheduled an interview block. Live video link activates in 60 minutes").