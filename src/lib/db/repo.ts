import { getDb } from './index';

export interface LedgerEntryRecord {
  id: string;
  checkout_id: string;
  capture_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  paypal_order_id: string | null;
  digest: string;
  rationale: string;
  rules_json: string;
  created_at: string;
}

/**
 * Computes today's spent velocity with a single SQL sum over ledger_entries.
 */
export function getTodaySpentVelocity(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total_cents 
       FROM ledger_entries 
       WHERE status IN ('COMPLETED') AND date(created_at) = date('now')`
    )
    .get() as { total_cents: number } | undefined;

  return row ? Number(row.total_cents) : 0;
}

/**
 * Inserts a new mandate policy.
 */
export function insertMandate(
  id: string,
  sourceText: string,
  policyJson: string,
  confirmed: boolean = true
): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO mandates (id, created_at, source_text, policy_json, confirmed)
     VALUES (?, datetime('now'), ?, ?, ?)`
  );
  stmt.run(id, sourceText, policyJson, confirmed ? 1 : 0);
}

/**
 * Retrieves a mandate policy by ID.
 */
export function getMandate(id: string): {
  id: string;
  created_at: string;
  source_text: string;
  policy_json: string;
  confirmed: number;
} | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM mandates WHERE id = ?`).get(id) as any;
}

/**
 * Retrieves the most recent confirmed mandate.
 */
export function getLatestMandate(): {
  id: string;
  created_at: string;
  source_text: string;
  policy_json: string;
  confirmed: number;
} | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM mandates WHERE confirmed = 1 ORDER BY created_at DESC LIMIT 1`)
    .get() as any;
}

/**
 * Retrieves all ledger entries with joined checkout info.
 */
export function getAllLedgerEntries(): LedgerEntryRecord[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM ledger_entries ORDER BY created_at DESC`)
    .all() as LedgerEntryRecord[];
}

