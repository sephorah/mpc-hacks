export type CaseType = 'renewal' | 'lab-followup';

export type Lane =
  | 'needs-sync'     // red flag / rules → live visit required, leaves our path
  | 'async-pending'  // closeable async, but missing something (lab, etc.)
  | 'async-ready';   // closeable async, nothing missing → provider can close

export type Status = 'open' | 'closed';

export type Case = {
  id: string;
  type: CaseType;
  lane: Lane;
  redFlags: boolean;       // did any deterministic red-flag question trip
  missing: string | null;  // what's blocking close, e.g. "lab result"; null when ready
  freeText: string;        // the one field the LLM digests
  packet: string | null;   // LLM-generated decision packet; null until provider opens
  status: Status;
  createdAt: number;
  closedAt: number | null;
};

export type Patient {
    id: string;
    createdAt: string;
};