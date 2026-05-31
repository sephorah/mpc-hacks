import Database from 'better-sqlite3';
import path from 'node:path';

// Store the DB file in the workspace root
const dbPath = path.resolve(process.cwd(), 'treatment_plans.db');

// Initialize the SQLite database
const db = new Database(dbPath);

// Create the treatment_plans table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS treatment_plans (
    case_id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    condition_key TEXT NOT NULL,
    treatment_plan TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    approved_at INTEGER NOT NULL
  )
`);

export interface TreatmentPlan {
  case_id: string;
  patient_name: string;
  service_type: string;
  condition_key: string;
  treatment_plan: string;
  doctor_name: string;
  approved_at: number;
}

export function saveTreatmentPlan(plan: TreatmentPlan) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO treatment_plans (
      case_id, patient_name, service_type, condition_key, treatment_plan, doctor_name, approved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    plan.case_id,
    plan.patient_name,
    plan.service_type,
    plan.condition_key,
    plan.treatment_plan,
    plan.doctor_name,
    plan.approved_at
  );
}

export function getTreatmentPlan(caseId: string): TreatmentPlan | undefined {
  const stmt = db.prepare(`SELECT * FROM treatment_plans WHERE case_id = ?`);
  return stmt.get(caseId) as TreatmentPlan | undefined;
}
