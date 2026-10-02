import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  const db = getDb();
  const runId = params.runId;

  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as any;
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const steps = db
    .prepare('SELECT * FROM run_steps WHERE run_id = ? ORDER BY seq ASC')
    .all(runId) as any[];

  const parsedSteps = steps.map((s) => ({
    ...s,
    payload: JSON.parse(s.payload_json || '{}'),
  }));

  // Fetch associated checkout: prefer NEEDS_APPROVAL or ALLOW, then latest
  const checkout = db
    .prepare(`
      SELECT * FROM checkouts 
      WHERE run_id = ? 
      ORDER BY 
        CASE decision 
          WHEN 'NEEDS_APPROVAL' THEN 1 
          WHEN 'ALLOW' THEN 2 
          ELSE 3 
        END, 
        created_at DESC 
      LIMIT 1
    `)
    .get(runId) as any;


  let parsedCheckout = null;
  if (checkout) {
    parsedCheckout = {
      ...checkout,
      basket: JSON.parse(checkout.basket_json || '{}'),
      reasons: JSON.parse(checkout.reasons_json || '[]'),
    };
  }

  // Fetch mandate
  const mandate = db
    .prepare('SELECT * FROM mandates WHERE id = ?')
    .get(run.mandate_id) as any;

  let parsedPolicy = null;
  if (mandate) {
    parsedPolicy = JSON.parse(mandate.policy_json || '{}');
  }

  return NextResponse.json({
    run,
    steps: parsedSteps,
    checkout: parsedCheckout,
    policy: parsedPolicy,
  });
}
