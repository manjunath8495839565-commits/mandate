import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTodaySpentVelocity } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const entries = db
    .prepare(`
      SELECT 
        l.id,
        l.checkout_id,
        l.capture_id,
        l.amount_cents,
        l.currency,
        l.status,
        l.paypal_order_id,
        l.digest,
        l.rationale,
        l.rules_json,
        l.created_at,
        c.decision,
        c.reasons_json,
        c.merchant_id,
        c.basket_json
      FROM ledger_entries l
      LEFT JOIN checkouts c ON l.checkout_id = c.id
      ORDER BY l.created_at DESC
    `)
    .all() as any[];

  const formatted = entries.map((entry) => ({
    id: entry.id,
    checkout_id: entry.checkout_id,
    capture_id: entry.capture_id,
    amount_cents: entry.amount_cents,
    currency: entry.currency || 'USD',
    status: entry.status,
    paypal_order_id: entry.paypal_order_id,
    digest: entry.digest,
    rationale: entry.rationale,
    decision: entry.decision || 'ALLOW',
    reasons: JSON.parse(entry.reasons_json || '[]'),
    rules: JSON.parse(entry.rules_json || '[]'),
    merchant_id: entry.merchant_id || 'unknown',
    basket: JSON.parse(entry.basket_json || '{}'),
    created_at: entry.created_at,
  }));

  const todaySpentCents = getTodaySpentVelocity();
  const totalCount = formatted.length;
  const completedCount = formatted.filter((e) => e.status === 'COMPLETED').length;

  return NextResponse.json({
    entries: formatted,
    stats: {
      today_spent_cents: todaySpentCents,
      total_count: totalCount,
      completed_count: completedCount,
    },
  });
}
