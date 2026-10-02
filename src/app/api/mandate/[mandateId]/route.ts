import { NextResponse } from 'next/server';
import { getMandate } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { mandateId: string } }
) {
  const row = getMandate(params.mandateId);
  if (!row) {
    return NextResponse.json({ error: 'Mandate not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    source_text: row.source_text,
    created_at: row.created_at,
    confirmed: Boolean(row.confirmed),
    policy: JSON.parse(row.policy_json),
  });
}
