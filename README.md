# CareWorkspace

**Zero-wait-time async virtual care — built at MPC Hacks 2026 (Polytechnique Montréal)**

CareWorkspace rethinks where virtual care actually gets stuck. The clinical encounter is fast; the friction lives in everything before the clinician arrives. Instead of routing everyone into the same slow live-video queue, CareWorkspace asks a different question: *can this case close asynchronously right now, and if not, what's missing to close it?*

---

## How it works

A patient files a short structured intake — service type, a set of yes/no red-flag safety questions, and document readiness. Deterministic rules (not the AI) read that intake and assign one of three lanes:

| Lane | Condition | What happens |
|---|---|---|
| `needs-sync` | Any red flag triggered | Routed to a live visit |
| `async-pending` | Missing document | Parked until the patient supplies it |
| `async-ready` | All clear | Queued for async clinician review |

Google Gemini summarises the patient's intake into a short decision brief. If the model is unavailable, a deterministic fallback surfaces the raw intake so the case can still move forward. The clinician reviews like-with-like (cases are grouped by type on their dashboard), reads the brief, enters their name, and attests to close — in under a minute. The patient is notified once the case is reviewed.

**The model makes zero clinical or routing decisions.** Every safety gate is deterministic. The AI's only job is to reduce reading time, a human makes all final decisions.

---

## Tech stack

- **Framework:** Next.js 16 + React 19, TypeScript throughout
- **Styling:** Tailwind CSS v4
- **Server:** Custom `tsx`-based server 
- **AI:** Google Gemini 2.5 Flash via `@google/genai`
- **State:** In-memory
- **Linting / formatting:** Biome
- **Deployment target:** Vercel

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Design principles

**Safety is the first gate, not a bolt-on.** Any red flag in the intake immediately routes to a live visit — no model involvement, no override path.

**The model assists; rules and humans decide.** Gemini writes a summary brief. The clinician reads it and attests. Routing, classification, and closure are all deterministic or human-gated.

**Resolution over routing.** The system is designed to close cases, not just queue them. The async lanes exist to eliminate wait time for cases that don't need a live slot, not to defer them indefinitely.

---

## What's next

- Tighter, more specialised intake summaries to improve brief quality and reduce error margin
- Direct patient file attachment to eliminate document round-trips
- Rules-defined cohorting — reviewing a pre-screened homogeneous group and attesting once — as the path from hundreds of cases a day toward thousands

---

*Built at MPC Hacks 2026 for Dialogue's Zero Wait Time Virtual Care challenge.*

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
