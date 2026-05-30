export type CaseType = 'general-enquiry' |'med-renewal' | 'lab-followup' | 'chronic-condition-check-in';
export const PossibleCaseTypes = ['general-enquiry', 'med-renewal', 'lab-followup', 'chronic-condition-check-in'] as const;

export type Lane =
  | 'needs-sync'     // red flag → live visit, leaves our path
  | 'async-pending'  // closeable async, missing something
  | 'async-ready';   // closeable async, nothing missing → close

export type Case = {
  id: string;
  type: CaseType;
  lane: Lane;
  // answers: Record<string, boolean>;  // What is this?
  redFlags: boolean;
  missing: string | null;   // what's blocking an async close e.g. "lab result"; null when ready
  freeText: string;         // LLM digests this
  packet: string | null;    // LLM summary ; null until provider opens 
  status: 'open' | 'closed';
  createdAt: number;
  closedAt: number | null;
};

export type Patient {
    id: string;
    createdAt: string;
};